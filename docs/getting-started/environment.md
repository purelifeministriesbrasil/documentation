# Variáveis de Ambiente e Configuração

Segurança por padrão: o frontend só recebe valores **públicos**; todos os segredos ficam no Worker
(`wrangler secret put`) ou no cofre da organização. O Worker valida a configuração de cada funcionalidade a cada
requisição e **falha fechado** (`503` + log com os nomes das chaves inválidas, nunca os valores).

Arquivos de referência (sempre atualizados com comentários):

- `frontend/.env.example`
- `backend/.dev.vars.example` (Worker em desenvolvimento)
- `backend/.env.example` (scripts Node: migrations, caixa pastoral, testes de integração)

---

## 1. Frontend (Cloudflare Pages — variáveis de build)

| Variável | Obrigatória | Exemplo | Uso |
|---|---|---|---|
| `PUBLIC_SITE_ORIGIN` | sim | `https://purelifeministriesbrasil.org` | Origem canônica |
| `PUBLIC_API_URL` | sim | `https://api.purelifeministriesbrasil.org` | Base da API; entra no CSP (`connect-src`, `form-action`) |
| `PUBLIC_TURNSTILE_SITE_KEY` | sim | `0x4AAAA…` | Widget Turnstile (teste: `1x00000000000000000000AA`) |
| `NODE_VERSION` | sim (Pages) | `22` | Versão do Node no build |

!!! note
    `PUBLIC_SUPABASE_URL` e `PUBLIC_SUPABASE_ANON_KEY` foram **removidas**: o navegador nunca acessa o Supabase.

---

## 2. Backend Worker — variáveis não secretas (`[vars]` do `wrangler.toml`)

| Variável | Exemplo | Descrição |
|---|---|---|
| `PUBLIC_SITE_ORIGIN` | `https://purelifeministriesbrasil.org` | Única origem aceita (CORS e verificação de `Origin`) |
| `ENVIRONMENT` | `production` | `production` proíbe chaves de teste do Turnstile e origens `localhost` |
| `PAYMENT_PROVIDER` | `asaas` | `asaas` ou `mercadopago` |
| `PIX_EXPIRATION_MINUTES` | `60` | Validade do QR Code (30 a 43200) |
| `TRIAGE_KEY_CURRENT_VERSION` | `1` | Versão de chave usada para novas cifras |
| `EMAIL_FROM` | `Pure Life Ministries Brasil <nao-responda@purelifeministriesbrasil.org>` | Remetente |
| `STAFF_NOTIFICATION_EMAIL` | `purelifeministriesbrasil1986@gmail.com` | Recebe avisos (sem dados pessoais) |
| `ASAAS_API_BASE_URL` | `https://api.asaas.com/v3` | Sandbox: `https://api-sandbox.asaas.com/v3` |

## 3. Backend Worker — segredos (`wrangler secret put <NOME>`)

| Segredo | Obrigatório | Como obter |
|---|---|---|
| `DATABASE_URL` | sim | Supabase → *Connect* → **Transaction pooler** (porta 6543) |
| `TRIAGE_KEY_V1` | sim | `openssl rand -base64 32` (exatamente 32 bytes) |
| `TRIAGE_KEY_V2…` | rotação | Mesma regra; ver [Rotação de Chaves](../operations/key-rotation.md) |
| `HASH_PEPPER` | sim | `openssl rand -base64 32` (≥ 32 bytes) |
| `TURNSTILE_SECRET_KEY` | sim | Cloudflare → Turnstile → widget |
| `RESEND_API_KEY` | newsletter | Resend → API Keys (*Sending access*). Sem ela, triagem/contato funcionam sem aviso à equipe e a newsletter responde 503 |
| `ASAAS_API_KEY` | se Asaas | Asaas → Integrações → API |
| `ASAAS_WEBHOOK_SECRET` | se Asaas | Valor aleatório definido por você no cadastro do webhook |
| `ASAAS_DONATION_CUSTOMER_ID` | se Asaas | ID `cus_…` do cliente “Doador Anônimo” |
| `MERCADOPAGO_ACCESS_TOKEN` | se Mercado Pago | Credenciais de produção |
| `MERCADOPAGO_WEBHOOK_SECRET` | se Mercado Pago | Assinatura secreta do webhook |
| `MERCADOPAGO_PAYER_FALLBACK_EMAIL` | se Mercado Pago | E-mail institucional usado quando o doador não informa o seu |

---

## 4. Desenvolvimento local

```bash
# API
cd backend && cp .dev.vars.example .dev.vars   # preencha TRIAGE_KEY_V1 e HASH_PEPPER com chaves NOVAS
pnpm dev                                         # http://localhost:8787

# Site
cd frontend && cp .env.example .env              # PUBLIC_API_URL=http://localhost:8787
pnpm dev                                         # http://localhost:4321
```

Com o site em `http://localhost:4321`, use `PUBLIC_SITE_ORIGIN=http://localhost:4321` no `.dev.vars`.
Chaves de teste oficiais do Turnstile: site `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`.

---

## 5. Scripts Node (`backend/.env.example`)

| Variável | Uso |
|---|---|
| `DATABASE_URL` | `pnpm db:migrate` e caixa pastoral (prefira Session pooler/Direct, porta 5432) |
| `TRIAGE_KEY_V1` (…`Vn`) | Caixa pastoral (decifra localmente) |
| `OPERATOR` | Identificação de quem lê dados na caixa pastoral (gravada em `audit_events`) |
| `TEST_DATABASE_URL` | Testes de integração — **somente** banco descartável (tabelas são truncadas) |
