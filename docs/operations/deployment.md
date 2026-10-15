# Runbook de Implantação nas Contas Institucionais (Cloudflare + Supabase)

Este runbook leva o ecossistema das contas pessoais de desenvolvimento para as **contas institucionais do
Pure Life Ministries Brasil**, do zero, com o frontend no **Cloudflare Pages** e a API no **Cloudflare Workers**
(sem custo de plano Pro da Vercel).

!!! warning "Ordem importa"
    Siga as etapas na ordem. Cada etapa termina com uma **verificação**; não avance se ela falhar.
    Nenhum segredo deste processo deve ser colado em chat, e-mail, issue ou commit — use o cofre de senhas da organização.

---

## 0. Pré-requisitos

| Item | Responsável | Observação |
|---|---|---|
| Conta **Cloudflare** da organização (com 2FA) | Administração | Zona `purelifeministriesbrasil.org` será movida para ela |
| Organização **Supabase** do ministério (com 2FA) | Administração | Plano Free atende; Pro habilita PITR |
| Conta **Resend** com o domínio do ministério | Comunicação | E-mails transacionais (newsletter, avisos à equipe) |
| Conta **Asaas** (ou **Mercado Pago**) em nome do CNPJ | Financeiro | Gateway PIX |
| Organização **GitHub** `purelifeministriesbrasil` | TI | Repositórios `backend`, `frontend`, `documentation` |
| Cofre de senhas da organização (ex.: Bitwarden Organizations) | TI | Guarda chaves AES, pepper e credenciais |
| Máquina do operador com Node 22, pnpm 12, Git e `openssl` | TI | Para migrations e deploy do Worker |

Clone os repositórios e instale as dependências:

```bash
git clone https://github.com/purelifeministriesbrasil/backend.git
git clone https://github.com/purelifeministriesbrasil/frontend.git
cd backend && pnpm install --frozen-lockfile && cd ..
cd frontend && pnpm install --frozen-lockfile && cd ..
```

---

## 1. Chaves criptográficas (antes de tudo)

Gere **localmente** e salve imediatamente no cofre (itens separados, acesso restrito):

```bash
openssl rand -base64 32   # TRIAGE_KEY_V1 — chave AES-256 dos dados confidenciais
openssl rand -base64 32   # HASH_PEPPER   — pepper do HMAC de e-mails
openssl rand -base64 32   # ASAAS_WEBHOOK_SECRET (se usar Asaas)
```

!!! danger "Perda de chave = perda de dados"
    Sem `TRIAGE_KEY_V1` nenhuma triagem ou mensagem de contato pode ser lida novamente. Sem `HASH_PEPPER`
    a deduplicação da newsletter recomeça do zero. Mantenha cópia no cofre da organização com no mínimo
    duas pessoas com acesso. Rotação: [Rotação de Chaves](key-rotation.md).

---

## 2. Supabase (banco de dados)

1. **Criar projeto** na organização do ministério: região **South America (São Paulo) `sa-east-1`**, senha do
   banco forte (gerada no cofre).
2. **Strings de conexão** (*Connect* no topo do painel):
    - **Transaction pooler** (porta `6543`) → será o `DATABASE_URL` do Worker.
    - **Session pooler** ou **Direct** (porta `5432`) → usado apenas pelas migrations e pela caixa pastoral.
3. **Data API**: o frontend não usa o Supabase. Em *Project Settings → Data API*, desative a Data API (ou remova
   o schema `public` dos schemas expostos), se a opção estiver disponível no seu plano. As migrations já negam
   todo acesso a `anon`/`authenticated`; isso é defesa em profundidade.
4. **Aplicar as migrations** (fonte única de verdade: `backend/drizzle/`):

    ```bash
    cd backend
    export DATABASE_URL='postgresql://postgres.<ref>:<senha>@aws-0-sa-east-1.pooler.supabase.com:5432/postgres'
    pnpm db:migrate:dry-run   # lista: 0001_initial.sql, 0002_supabase_hardening_and_rls.sql
    pnpm db:migrate
    ```

5. **Verificação**:
    - *Advisors → Security Advisor*: nenhum alerta de RLS, `search_path` ou `SECURITY DEFINER`.
    - No *SQL Editor*:

    ```sql
    select relname, relrowsecurity from pg_class
     where relnamespace = 'public'::regnamespace and relkind = 'r' order by 1;   -- todas = true
    select count(*) from information_schema.role_table_grants
     where table_schema = 'public' and grantee in ('anon','authenticated');     -- 0
    ```

Detalhes do endurecimento: [Hardening do Supabase](supabase-hardening.md).

---

## 3. Cloudflare: zona DNS e Turnstile

1. **Adicionar a zona** `purelifeministriesbrasil.org` à conta da organização e trocar os nameservers no registrador (Enom). Antes, confira que os registros A/AAAA apontam para a origem real e que o DNSSEC está desligado
   pelos indicados pela Cloudflare. Aguarde o status **Active**.
2. **Turnstile** → *Add widget*:
    - Nome: `purelife-site` · Hostnames: `purelifeministriesbrasil.org`, `www.purelifeministriesbrasil.org` · Modo: *Managed*.
    - Guarde a **Site Key** (pública → `PUBLIC_TURNSTILE_SITE_KEY`) e a **Secret Key** (cofre → `TURNSTILE_SECRET_KEY`).

!!! note
    As chaves de teste `1x0000…AA` são **recusadas** pelo Worker quando `ENVIRONMENT=production`.

---

## 4. Resend (e-mail transacional)

1. *Domains → Add domain* `purelifeministriesbrasil.org`; publique na Cloudflare os registros **SPF**, **DKIM** e o
   **DMARC** sugeridos e aguarde a verificação.
2. *API Keys → Create* com permissão **Sending access** restrita ao domínio → `RESEND_API_KEY` (cofre).
3. Defina o remetente (`EMAIL_FROM`, ex.: `Pure Life Ministries Brasil <nao-responda@purelifeministriesbrasil.org>`) e a caixa
   que recebe avisos (`STAFF_NOTIFICATION_EMAIL`) em `backend/wrangler.toml`.

---

## 5. Gateway PIX

Escolha **um** provedor e defina `PAYMENT_PROVIDER` em `backend/wrangler.toml`.

=== "Asaas (padrão)"

    1. Conta Asaas aprovada no CNPJ do ministério, com **chave PIX** cadastrada.
    2. *Integrações → API*: gere a chave de produção → `ASAAS_API_KEY` (cofre).
    3. *Clientes → Novo*: cadastre **“Doador Anônimo — doações pelo site”** com o CNPJ do ministério.
       Copie o ID (`cus_…`) → `ASAAS_DONATION_CUSTOMER_ID`. O Asaas exige cliente com CPF/CNPJ em toda
       cobrança; o e-mail do doador, quando informado, fica cifrado no nosso banco.
    4. *Integrações → Webhooks → Adicionar*:
        - URL: `https://api.purelifeministriesbrasil.org/api/webhooks/payment`
        - Token de autenticação: o valor gerado para `ASAAS_WEBHOOK_SECRET` (**nunca** a chave de API)
        - Eventos de cobrança: `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_OVERDUE`, `PAYMENT_DELETED`, `PAYMENT_REFUNDED`
        - Fila de envio: sequencial · Versão da API: v3
    5. Homologação: use primeiro `ASAAS_API_BASE_URL = "https://api-sandbox.asaas.com/v3"` com chaves de sandbox.

=== "Mercado Pago"

    1. *Suas integrações → Criar aplicação* (Checkout Transparente / Pagamentos online).
    2. *Credenciais de produção*: **Access Token** → `MERCADOPAGO_ACCESS_TOKEN` (cofre).
    3. *Webhooks*: URL `https://api.purelifeministriesbrasil.org/api/webhooks/payment`, evento **Pagamentos**;
       revele a **assinatura secreta** → `MERCADOPAGO_WEBHOOK_SECRET` (cofre).
    4. `MERCADOPAGO_PAYER_FALLBACK_EMAIL`: e-mail institucional usado como pagador quando o doador não informa
       o seu (o Mercado Pago exige `payer.email`).
    5. Em `wrangler.toml`: `PAYMENT_PROVIDER = "mercadopago"`.

---

## 6. API: Cloudflare Workers

```bash
cd backend
pnpm exec wrangler login            # autentique com a conta da ORGANIZAÇÃO
pnpm exec wrangler whoami           # confirme o account ID correto

# Segredos obrigatórios
pnpm exec wrangler secret put DATABASE_URL           # Transaction pooler (6543)
pnpm exec wrangler secret put TRIAGE_KEY_V1
pnpm exec wrangler secret put HASH_PEPPER
pnpm exec wrangler secret put TURNSTILE_SECRET_KEY
pnpm exec wrangler secret put RESEND_API_KEY

# Asaas
pnpm exec wrangler secret put ASAAS_API_KEY
pnpm exec wrangler secret put ASAAS_WEBHOOK_SECRET
pnpm exec wrangler secret put ASAAS_DONATION_CUSTOMER_ID
# — ou Mercado Pago —
# pnpm exec wrangler secret put MERCADOPAGO_ACCESS_TOKEN
# pnpm exec wrangler secret put MERCADOPAGO_WEBHOOK_SECRET
# pnpm exec wrangler secret put MERCADOPAGO_PAYER_FALLBACK_EMAIL

pnpm verify                          # lint + typecheck + testes
pnpm deploy                          # publica e associa api.purelifeministriesbrasil.org (custom_domain no wrangler.toml)
```

**Verificação**:

```bash
curl -s https://api.purelifeministriesbrasil.org/health                 # {"status":"healthy",...}
pnpm exec wrangler tail --format pretty                       # logs JSON sem PII
```

Se algum segredo faltar, as rotas afetadas respondem `503` e o log mostra `config.invalid` com os **nomes**
das chaves inválidas.

---

## 7. Site: Cloudflare Pages

1. *Workers & Pages → Create → Pages → Connect to Git* → `purelifeministriesbrasil/frontend`.
2. Build:
    - Framework preset: **Astro** · Build command: `pnpm build` · Output directory: `dist`
    - Variáveis de **build** (Production e Preview):

    | Variável | Valor |
    |---|---|
    | `NODE_VERSION` | `22` |
    | `PUBLIC_SITE_ORIGIN` | `https://purelifeministriesbrasil.org` |
    | `PUBLIC_API_URL` | `https://api.purelifeministriesbrasil.org` |
    | `PUBLIC_TURNSTILE_SITE_KEY` | Site Key do passo 3 |

3. *Custom domains*: adicione `purelifeministriesbrasil.org` e `www.purelifeministriesbrasil.org` (crie uma *Redirect Rule*
   `www` → apex, 301).
4. O build gera `dist/_headers` com o CSP calculado (hashes dos scripts inline + origem da API).

**Verificação**:

```bash
curl -sI https://purelifeministriesbrasil.org/ | grep -i -E "content-security-policy|strict-transport|x-frame"
curl -sI https://purelifeministriesbrasil.org/triagem/ | grep -i cache-control   # no-store
```

Abra o site com o DevTools e confirme **zero** violações de CSP no console.

---

## 8. Testes de fumaça em produção

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Enviar triagem de teste | Código `PLM-XXXX-XXXX` na tela; e-mail “Nova solicitação de triagem” sem dados pessoais |
| 2 | Ler a triagem pela caixa pastoral | `node scripts/pastoral-inbox.mjs show PLM-… --reason "teste de implantação"` decifra; `audit_events` registra |
| 3 | Enviar contato | Código `CTT-XXXX-XXXX` |
| 4 | Inscrever e-mail na newsletter | E-mail de confirmação; link abre `/newsletter/confirmar/` e confirma |
| 5 | Doação PIX de **R$ 5,00** | QR exibido; após pagar, `payment_charges.status = 'confirmed'` |
| 6 | Estornar a doação de teste no painel do gateway | Webhook `refunded` processado |
| 7 | Remover os registros de teste | Marque como `closed` e aguarde o expurgo, ou apague manualmente pelo SQL Editor |

---

## 9. Desativação das contas pessoais

1. **Dados legados**: o projeto Supabase pessoal usava o schema antigo (`triagens`, `contatos`, … com dados em
   claro). Se houver submissões reais, exporte-as com acesso restrito, trate-as conforme a LGPD (atendimento ou
   descarte) e **exclua o projeto** — não importe PII em claro para o projeto novo.
2. **Vercel**: remova o projeto e os domínios; o `vercel.json` foi retirado do repositório.
3. **Cloudflare pessoal**: remova Workers, rotas e widgets Turnstile antigos.
4. **Rotacione** qualquer credencial que tenha existido nas contas pessoais (gateway, Resend, Turnstile).

---

## 10. Rollback

| Componente | Como reverter |
|---|---|
| Worker | `pnpm exec wrangler deployments list` e `pnpm exec wrangler rollback <deployment-id>` |
| Pages | *Deployments* → implantação anterior → **Rollback to this deployment** |
| Banco | Migrations são *forward-only*. Para desfazer a 0002 em emergência, restaure o backup diário (ou PITR) — ver [Backup & Recuperação](backup-recovery.md). Nunca edite uma migration já aplicada: o runner recusa checksum divergente. |
| Gateway | Desative o webhook no painel do provedor; a API passa a responder 503 em `create-pix` se as credenciais forem removidas |

---

## 11. Limitações conhecidas

- **Doação mensal**: `frequency = "monthly"` registra a intenção e emite apenas a primeira cobrança PIX; a
  recorrência automática (assinatura no gateway) ainda não foi implementada.
- **Painel pastoral**: a leitura de dados cifrados é feita pela CLI auditada `scripts/pastoral-inbox.mjs`; um
  painel web (ex.: protegido por Cloudflare Access) é evolução recomendada.
- **Rate limiting**: configure uma regra de *Rate Limiting* na zona (ex.: 20 req/min por IP em `/api/forms/*` e
  `/api/donations/*`) como camada adicional ao Turnstile.
- **Wrangler 3**: o repositório usa Wrangler 3; localmente o runtime cai para `compatibility_date` 2025-07-18.
  Atualizar para Wrangler 4 é recomendado em uma mudança dedicada.
