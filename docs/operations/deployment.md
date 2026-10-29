# Runbook de Implantação nas Contas Institucionais (Cloudflare + Neon)

Este runbook leva o ecossistema das contas pessoais de desenvolvimento para as **contas institucionais do
Pure Life Ministries Brasil**, com o site no **Cloudflare Pages**, a API no **Cloudflare Workers** e o banco no
**Neon Postgres** (São Paulo), acessado pela API por meio do **Cloudflare Hyperdrive**.

!!! warning "Ordem importa"
    Siga as etapas na ordem. Cada etapa termina com uma **verificação**; não avance se ela falhar.
    Nenhum segredo deste processo deve ser colado em chat, e-mail, issue ou commit — use o cofre de senhas da
    organização.

---

## Situação atual (28/10/2026)

| Etapa | Situação | Observação |
|---|---|---|
| 1. Chaves criptográficas | ✅ Concluída | `TRIAGE_KEY_V1` e `HASH_PEPPER` no cofre |
| 2. Banco Neon + migrations | ✅ Concluída | 10 tabelas com RLS, região `aws-sa-east-1` |
| 3. Hyperdrive | ✅ Concluída | Configuração `purelife-db` ligada ao binding `HYPERDRIVE` |
| 4. Turnstile | ✅ Concluída | Widget com os hostnames do domínio oficial |
| 5. Resend | ⏳ Aguardando DNS | Registros criados na zona nova; a verificação ocorre quando a zona ficar ativa |
| 6. Gateway PIX | ⏸️ Em decisão | Site exibe a chave PIX do CNPJ (`PUBLIC_ENABLE_PIX_GATEWAY=false`) |
| 7. API (Worker) | ✅ Publicada em endereço provisório | `https://purelife-api.purelifeministriesbrasil1986.workers.dev` |
| 8. Site (Pages) | ✅ Publicado em endereço provisório | `https://purelife-site.pages.dev` |
| 9. Zona DNS e troca de nameservers | ⏳ Aguardando registrador | Registro A de origem criado; falta trocar os nameservers na eNom |
| 10. Domínio no site e na API | ⏳ Depende da etapa 9 | Ver [Virada do domínio](#10-virada-do-dominio) |
| 11. Testes de fumaça | ⏳ Depende da etapa 10 | — |
| 12. Desativação do legado | ⏳ Após a virada | WordPress, Supabase, Vercel e contas pessoais |

---

## 0. Pré-requisitos

| Item | Responsável | Observação |
|---|---|---|
| Conta **Cloudflare** da organização (com 2FA e e-mail verificado) | Administração | Workers só funcionam com o e-mail da conta verificado |
| Projeto **Neon** do ministério (região São Paulo) | Administração | O plano gratuito atende; o banco “dorme” sem uso e acorda sozinho |
| Conta **Resend** com o domínio do ministério | Comunicação | E-mails transacionais (newsletter e avisos à equipe) |
| Conta **Asaas** (ou **Mercado Pago**) em nome do CNPJ | Financeiro | Opcional enquanto o site exibe a chave PIX |
| Acesso ao **registrador** do domínio (eNom, via revendedor) | Liderança | Necessário para trocar os nameservers |
| Organização **GitHub** `purelifeministriesbrasil` | TI | Repositórios `backend`, `frontend`, `documentation` |
| Cofre de senhas da organização (ex.: Bitwarden Organizations) | TI | Guarda chaves AES, pepper e credenciais |
| Máquina do operador com Node 22, pnpm 12 e Git | TI | Para migrations e publicação |

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
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"   # TRIAGE_KEY_V1
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"   # HASH_PEPPER
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"   # ASAAS_WEBHOOK_SECRET (se usar Asaas)
```

!!! danger "Perda de chave = perda de dados"
    Sem `TRIAGE_KEY_V1` nenhuma triagem ou mensagem de contato pode ser lida novamente. Sem `HASH_PEPPER`
    a deduplicação da newsletter recomeça do zero. Mantenha cópia no cofre da organização com no mínimo
    duas pessoas com acesso. Rotação: [Rotação de Chaves](key-rotation.md).

---

## 2. Banco de dados: Neon

1. **Criar o projeto** no Neon com a conta institucional, na região **AWS São Paulo (`aws-sa-east-1`)**. A região
   não pode ser alterada depois.
2. **Strings de conexão** (*Connect*):
    - **Direta** (host **sem** `-pooler`) → migrations, caixa pastoral e Hyperdrive.
    - **Com pooling** (host **com** `-pooler`) → segredo `DATABASE_URL` do Worker, usado só como reserva do Hyperdrive.
    - Use `?sslmode=require` e **remova** `&channel_binding=require`, que o driver da API não suporta.
3. **Aplicar as migrations** (fonte única de verdade: `backend/drizzle/`):

    ```bash
    cd backend
    export DATABASE_URL='postgresql://<usuario>:<senha>@ep-<endpoint>.c-2.sa-east-1.aws.neon.tech/neondb?sslmode=require'
    pnpm db:migrate:dry-run   # lista: 0001_initial.sql, 0002_supabase_hardening_and_rls.sql
    pnpm db:migrate
    ```

4. **Verificação** (no *SQL Editor* do Neon):

    ```sql
    select relname, relrowsecurity from pg_class
     where relnamespace = 'public'::regnamespace and relkind = 'r' order by 1;   -- todas = true
    select filename, applied_at from schema_migrations order by 1;                -- 0001 e 0002
    ```

Detalhes do endurecimento: [Hardening do Banco](database-hardening.md). Configuração completa:
[Configuração do Banco (Neon)](../getting-started/database-setup.md).

---

## 3. Hyperdrive (conexões da API com o banco)

O Hyperdrive mantém conexões abertas com o Neon na rede da Cloudflare, o que corta o tempo de abertura de
conexão a cada requisição.

```bash
cd backend
pnpm exec wrangler hyperdrive create purelife-db \
  --connection-string="postgresql://<usuario>:<senha>@ep-<endpoint>.c-2.sa-east-1.aws.neon.tech/neondb?sslmode=require"
```

Copie o `id` retornado para o bloco `[[hyperdrive]]` do `backend/wrangler.toml` (binding `HYPERDRIVE`). Com o
binding presente, a API usa a conexão do Hyperdrive; sem ele, usa o segredo `DATABASE_URL`.

**Verificação**: depois da etapa 7, `POST /api/forms/newsletter/confirm` com um token inexistente responde
`410` em menos de 1 s (a consulta passou pelo banco).

---

## 4. Cloudflare: Turnstile

*Turnstile → Add widget*:

- Nome: `purelife-site` · Hostnames: `purelifeministriesbrasil.org`, `www.purelifeministriesbrasil.org` · Modo: *Managed*.
- Guarde a **Site Key** (pública → `PUBLIC_TURNSTILE_SITE_KEY`) e a **Secret Key** (cofre → `TURNSTILE_SECRET_KEY`).

!!! note
    As chaves de teste `1x0000…AA` são **recusadas** pelo Worker quando `ENVIRONMENT=production`. Em
    desenvolvimento local use as chaves de teste, porque a chave real só funciona nos hostnames cadastrados.

---

## 5. Resend (e-mail transacional)

1. *Domains → Add domain* `purelifeministriesbrasil.org`. Use **Auto configure** com a conta Cloudflare da
   organização ou copie os registros manualmente, sempre como **Somente DNS** (nuvem cinza). O Resend cria
   `resend._domainkey` (TXT) e os CNAMEs `send` e `rsend`; **não altere** o MX nem o SPF do Zoho na raiz.
2. *API Keys → Create* com permissão **Sending access** restrita ao domínio → `RESEND_API_KEY` (cofre).
3. Remetente (`EMAIL_FROM`) e destinatário dos avisos (`STAFF_NOTIFICATION_EMAIL`) ficam em `backend/wrangler.toml`.
4. A verificação do domínio só conclui depois que a zona ficar **Active** (etapa 9).

---

## 6. Gateway PIX (opcional enquanto a chave PIX estiver em uso)

Por decisão da diretoria, o site exibe a **chave PIX do CNPJ** com botão de copiar e envio de comprovante pelo
WhatsApp (`PUBLIC_ENABLE_PIX_GATEWAY=false`). Para ligar o PIX dinâmico, escolha **um** provedor, defina
`PAYMENT_PROVIDER` em `backend/wrangler.toml` e publique o site com `PUBLIC_ENABLE_PIX_GATEWAY=true`.

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

As inscrições da **Viagem EUA** são pagas na plataforma da SEBI (link fixo na página `/viagem-eua/`) e não
passam pela API.

---

## 7. API: Cloudflare Workers

```bash
cd backend
pnpm exec wrangler login            # autentique com a conta da ORGANIZAÇÃO
pnpm exec wrangler whoami           # confirme a conta e o account ID

# Segredos obrigatórios (cada comando pede o valor; cole do cofre)
pnpm exec wrangler secret put DATABASE_URL           # Neon com pooling (reserva do Hyperdrive)
pnpm exec wrangler secret put TRIAGE_KEY_V1
pnpm exec wrangler secret put HASH_PEPPER
pnpm exec wrangler secret put TURNSTILE_SECRET_KEY
pnpm exec wrangler secret put RESEND_API_KEY
# Gateway (somente se ligado): ASAAS_* ou MERCADOPAGO_*

pnpm verify                          # lint + fronteiras + typecheck + testes
pnpm deploy                          # publica e associa api.purelifeministriesbrasil.org
```

!!! info "Antes da zona ficar ativa"
    O domínio personalizado (`custom_domain` no `wrangler.toml`) só pode ser associado com a zona **Active** na
    mesma conta. Até lá, a API é publicada no endereço `workers.dev` com uma cópia local do `wrangler.toml`
    sem o bloco `[[routes]]` e com `workers_dev = true` (`wrangler.workersdev.toml`, fora do git):

    ```bash
    pnpm exec wrangler deploy --config wrangler.workersdev.toml
    ```

    Os segredos são do Worker `purelife-api` e valem para os dois endereços.

**Verificação**:

```bash
curl -s https://api.purelifeministriesbrasil.org/health                 # {"status":"healthy",...}
pnpm exec wrangler tail --format pretty                                 # logs JSON sem PII
```

Se algum segredo faltar, as rotas afetadas respondem `503` e o log mostra `config.invalid` com os **nomes**
das chaves inválidas.

---

## 8. Site: Cloudflare Pages

O projeto `purelife-site` foi criado por **upload direto** (sem integração com o GitHub). Cada publicação é
feita a partir de um build local:

```bash
cd frontend
export PUBLIC_SITE_ORIGIN=https://purelifeministriesbrasil.org
export PUBLIC_API_URL=https://api.purelifeministriesbrasil.org
export PUBLIC_TURNSTILE_SITE_KEY=<site key do Turnstile>
export PUBLIC_ENABLE_PIX_GATEWAY=false
pnpm ci:verify                                                        # typecheck + build + verificações
cd ../backend
pnpm exec wrangler pages deploy ../frontend/dist --project-name purelife-site --branch main
```

- `--branch main` publica em produção; qualquer outro nome de branch gera uma **prévia** em
  `https://<branch>.purelife-site.pages.dev`, útil para revisão antes do merge.
- O build gera `dist/_headers` com o CSP calculado (hashes dos scripts inline + origem da API) e copia
  `public/_redirects` com os redirecionamentos 301 do site antigo.
- Para publicar automaticamente a cada merge, crie um **API Token** da Cloudflare (permissão *Cloudflare Pages:
  Edit*) e use-o num workflow do GitHub Actions com o mesmo comando acima.

**Verificação**:

```bash
curl -sI https://purelife-site.pages.dev/ | grep -i -E "content-security-policy|strict-transport|x-frame"
curl -sI https://purelife-site.pages.dev/triagem/ | grep -i cache-control   # no-store
```

Abra o site com o DevTools e confirme **zero** violações de CSP no console.

---

## 9. Zona DNS e troca de nameservers

1. **Adicionar a zona** `purelifeministriesbrasil.org` à conta da organização (plano Free).
2. **Corrigir os registros importados.** A varredura automática copia os IPs da Cloudflare antiga (a zona
   estava em outra conta Cloudflare), e não a origem real:
    - apague os registros **A** e **AAAA** com IPs `104.21.x`, `172.67.x` e `2606:4700:…`;
    - crie `A`, nome `@`, valor `158.69.199.156` (servidor do WordPress antigo), **com proxy**;
    - mantenha o `CNAME www`, os 3 `MX` e os `TXT` do Zoho e os registros do Resend.
3. **DNSSEC**: confirme que está desligado no registrador (consulta RDAP: `delegationSigned: false`).
4. **Trocar os nameservers** no registrador (**eNom**, provavelmente via revendedor; domínio vence em
   16/08/2027) para os indicados pela Cloudflare: `ivy.ns.cloudflare.com` e `tanner.ns.cloudflare.com`.
5. Clique em **“Atualizei meus nameservers”** e aguarde o status **Active** (de minutos a 24 h).

**Verificação**: `nslookup -type=NS purelifeministriesbrasil.org 1.1.1.1` mostra `ivy` e `tanner`; o site
antigo continua abrindo e os e-mails do Zoho continuam chegando.

---

## 10. Virada do domínio

Com a zona ativa:

1. **API**: `cd backend && pnpm deploy` associa `api.purelifeministriesbrasil.org`.
2. **Resend**: clique em *Verify* (ou aguarde a verificação automática).
3. **Site**: em *Workers & Pages → purelife-site → Custom domains*, adicione `purelifeministriesbrasil.org` e
   `www.purelifeministriesbrasil.org`. A Cloudflare substitui o registro A do WordPress. Crie uma *Redirect
   Rule* `www` → apex (301, preservando a query string).
4. **Rate limiting**: em *Security → WAF → Rate limiting rules*, limite por IP as rotas `/api/` do host `api.`.

---

## 11. Testes de fumaça em produção

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Enviar triagem de teste | Código `PLM-XXXX-XXXX` na tela; e-mail “Nova solicitação de triagem” sem dados pessoais |
| 2 | Ler a triagem pela caixa pastoral | `node --env-file=.env scripts/pastoral-inbox.mjs show PLM-… --reason "teste de implantação"` decifra; `audit_events` registra |
| 3 | Enviar contato | Código `CTT-XXXX-XXXX` |
| 4 | Inscrever e-mail na newsletter | E-mail de confirmação; link abre `/newsletter/confirmar/` e confirma |
| 5 | Doação | Chave PIX exibida e copiada; com gateway ligado, PIX de R$ 5,00 confirmado em `payment_charges` |
| 6 | Endereços antigos | `/sobre-nos/`, `/residencial/` e `/doacao/` redirecionam (301) para as páginas novas |
| 7 | Remover os registros de teste | Apague manualmente pelo SQL Editor do Neon |

---

## 12. Desativação do legado

1. **WordPress antigo**: depois da virada, avise o responsável pela hospedagem para desativá-la. Por decisão
   da diretoria, **nenhum dado** do site antigo (clientes, pedidos, doações, newsletter) é importado ou mantido;
   o backup recebido deve ser descartado. Ver [Migração do Site Antigo](legacy-migration.md).
2. **Supabase**: o projeto foi substituído pelo Neon; exclua-o em *Settings → General → Delete project*.
3. **Vercel**: remova o projeto e os domínios; o `vercel.json` foi retirado do repositório.
4. **Cloudflare pessoal**: remova Workers, rotas e widgets Turnstile antigos.
5. **Rotacione** qualquer credencial que tenha circulado fora do cofre (senhas de contas, chaves de API,
   senha do banco). Após trocar a senha do Neon, atualize o Hyperdrive e o segredo:

    ```bash
    pnpm exec wrangler hyperdrive update <id> --connection-string="postgresql://…"
    pnpm exec wrangler secret put DATABASE_URL
    ```

---

## 13. Rollback

| Componente | Como reverter |
|---|---|
| Worker | `pnpm exec wrangler deployments list` e `pnpm exec wrangler rollback <deployment-id>` |
| Pages | *Deployments* → implantação anterior → **Rollback to this deployment** |
| Domínio | Remova os *Custom domains* do Pages e recrie o registro `A @ 158.69.199.156` (com proxy) enquanto o WordPress existir |
| Banco | Migrations são *forward-only*. Em emergência, restaure um ponto anterior pelo Neon — ver [Backup & Recuperação](backup-recovery.md). Nunca edite uma migration já aplicada: o runner recusa checksum divergente. |
| Gateway | Desative o webhook no painel do provedor e publique o site com `PUBLIC_ENABLE_PIX_GATEWAY=false` |

---

## 14. Limitações conhecidas

- **Doação mensal**: `frequency = "monthly"` registra a intenção e emite apenas a primeira cobrança PIX; a
  recorrência automática (assinatura no gateway) ainda não foi implementada.
- **Painel pastoral**: a leitura de dados cifrados é feita pela CLI auditada `scripts/pastoral-inbox.mjs`; um
  painel web (ex.: protegido por Cloudflare Access) é evolução recomendada.
- **Publicação do site**: o projeto Pages usa upload direto; a automação por GitHub Actions depende de um API
  Token da Cloudflare.
- **Wrangler 3**: o repositório usa Wrangler 3; localmente o runtime cai para `compatibility_date` 2025-07-18.
  Atualizar para Wrangler 4 é recomendado em uma mudança dedicada.
