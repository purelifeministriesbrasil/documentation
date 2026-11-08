# Variáveis de Ambiente e Configuração

Segurança por padrão: o frontend só recebe valores **públicos**; todos os segredos ficam no Worker
(`wrangler secret put`) ou no cofre da organização. O Worker valida a configuração de cada funcionalidade a cada
requisição e **falha fechado** (`503` + log com os nomes das chaves inválidas, nunca os valores).

Arquivos de referência no código: [`frontend/.env.example`](https://github.com/purelifeministriesbrasil/frontend/blob/4a08dfc03ef6f5cc6adf907da5bfa454960a9add/.env.example), [`backend/.dev.vars.example`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/.dev.vars.example) (Worker em desenvolvimento) e [`backend/.env.example`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/.env.example) (scripts Node: migrations, caixa pastoral, testes de integração).

---

## 0. Matriz por funcionalidade (backend)

O Worker valida cada grupo de configuração por requisição ([`env.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/config/env.ts)). Uma funcionalidade só responde se **todas** as variáveis do seu grupo estiverem válidas; caso contrário, `503` e log `config.invalid` com os **nomes** (nunca os valores).

| Rota / função | Banco | Cripto (`TRIAGE_KEY_V*`, `HASH_PEPPER`) | Turnstile | E-mail (3 chaves) | Pagamento |
|---|---|---|---|---|---|
| `POST /api/forms/triagem` | sim | sim | sim | opcional (aviso à equipe) | — |
| `POST /api/forms/contato` | sim | sim | sim | opcional (aviso à equipe) | — |
| `POST /api/forms/newsletter` | sim | sim | sim (se houver token) | **obrigatório** | — |
| `POST /api/forms/newsletter/confirm` | sim | sim | — | — | — |
| `POST /api/donations/create-pix` | sim | sim | sim | — | sim |
| `POST /api/webhooks/payment` | sim | — | — | — | sim |
| Cron de expurgo | sim | — | — | — | — |

O grupo **e-mail** exige as **três** variáveis juntas: `RESEND_API_KEY`, `EMAIL_FROM` e `STAFF_NOTIFICATION_EMAIL`. Com qualquer uma ausente, os avisos à equipe de triagem e contato são desativados (log `email.notifications_disabled`) e a newsletter responde 503.

---

## 1. Frontend (variáveis de build)

No pipeline, os valores vêm do workflow [`ci.yml`](https://github.com/purelifeministriesbrasil/frontend/blob/4a08dfc03ef6f5cc6adf907da5bfa454960a9add/.github/workflows/ci.yml) (ver [Deploy, §8](../operations/deployment.md#8-site-cloudflare-pages)); localmente, de `frontend/.env`.

| Variável | Lida pelo código? | Exemplo | Uso |
|---|---|---|---|
| `PUBLIC_API_URL` | sim | `https://api.purelifeministriesbrasil.org` | Base da API; entra no CSP (`connect-src`, `form-action`) pelo `generate-csp.mjs` |
| `PUBLIC_TURNSTILE_SITE_KEY` | sim | `0x4AAAA…` | Widget Turnstile (teste: `1x00000000000000000000AA`). No job `deploy`, vem da variável do repositório e o build falha se estiver vazia |
| `PUBLIC_ENABLE_PIX_GATEWAY` | sim | `false` | `true` liga o PIX dinâmico pela API; qualquer outro valor mostra a chave PIX do CNPJ. O workflow fixa `"false"` |
| `PUBLIC_SITE_ORIGIN` | **não** (somente declarada em `env.d.ts` e definida na CI) | `https://purelifeministriesbrasil.org` | Nenhum código a lê: a origem está fixa em `site-config.ts` e `astro.config.mjs`. Mantida por convenção |

!!! note
    `NODE_VERSION` **não** é variável deste projeto (não aparece nos repositórios). Node 22 e pnpm 12 são declarados nos workflows. O navegador nunca acessa o banco: as antigas `PUBLIC_SUPABASE_*` foram removidas.

---

## 2. Backend Worker — variáveis não secretas (`[vars]` do `wrangler.toml`)

| Variável | Exemplo | Descrição |
|---|---|---|
| `PUBLIC_SITE_ORIGIN` | `https://purelifeministriesbrasil.org` | Única origem aceita (CORS e verificação de `Origin`); também monta o link de confirmação da newsletter |
| `ENVIRONMENT` | `production` | `production` proíbe chaves de teste do Turnstile e origens `localhost` |
| `PAYMENT_PROVIDER` | (não definido) | `asaas` ou `mercadopago`. **Gateway ainda não escolhido:** sem a variável, doações dinâmicas e webhook respondem 503 e o site usa a chave PIX manual |
| `PIX_EXPIRATION_MINUTES` | `60` | Validade do QR Code (30 a 43200) |
| `TRIAGE_KEY_CURRENT_VERSION` | `1` | Versão de chave usada para novas cifras |
| `EMAIL_FROM` | `Pure Life Ministries Brasil <nao-responda@purelifeministriesbrasil.org>` | Remetente |
| `STAFF_NOTIFICATION_EMAIL` | `purelifeministriesbrasil1986@gmail.com` | Recebe avisos (sem dados pessoais) |
| `ASAAS_API_BASE_URL` | `https://api.asaas.com/v3` | Sandbox: `https://api-sandbox.asaas.com/v3` |

## 3. Backend Worker — bindings

| Binding | Tipo | Descrição |
|---|---|---|
| `HYPERDRIVE` | Hyperdrive (`purelife-db`) | Conexão com o Neon pela borda; quando presente, tem precedência sobre `DATABASE_URL` |

## 4. Backend Worker — segredos (`wrangler secret put <NOME>`)

| Segredo | Obrigatório | Como obter |
|---|---|---|
| `DATABASE_URL` | sim (reserva) | Neon → *Connect* → conexão **com pooling** (host com `-pooler`), `?sslmode=require` |
| `TRIAGE_KEY_V1` | sim | `openssl rand -base64 32` ou `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` (exatamente 32 bytes) |
| `TRIAGE_KEY_V2…` | rotação | Mesma regra; ver [Rotação de Chaves](../operations/key-rotation.md) |
| `HASH_PEPPER` | sim | `openssl rand -base64 32` (≥ 32 bytes) |
| `TURNSTILE_SECRET_KEY` | sim | Cloudflare → Turnstile → widget |
| `RESEND_API_KEY` | newsletter (com `EMAIL_FROM` e `STAFF_NOTIFICATION_EMAIL`) | Resend → API Keys (*Sending access*). Sem o trio completo, triagem/contato funcionam sem aviso à equipe e a newsletter responde 503 |
| `ASAAS_API_KEY` | se Asaas | Asaas → Integrações → API |
| `ASAAS_WEBHOOK_SECRET` | se Asaas | Valor aleatório definido por você no cadastro do webhook |
| `ASAAS_DONATION_CUSTOMER_ID` | se Asaas | ID `cus_…` do cliente “Doador Anônimo” |
| `MERCADOPAGO_ACCESS_TOKEN` | se Mercado Pago | Credenciais de produção |
| `MERCADOPAGO_WEBHOOK_SECRET` | se Mercado Pago | Assinatura secreta do webhook |
| `MERCADOPAGO_PAYER_FALLBACK_EMAIL` | se Mercado Pago | E-mail institucional usado quando o doador não informa o seu |

---

## 5. Desenvolvimento local

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

Com o binding do Hyperdrive no `wrangler.toml`, defina também a variável de ambiente
`CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` com a conexão do banco de desenvolvimento.

---

## 6. Scripts Node (`backend/.env.example`)

| Variável | Uso |
|---|---|
| `DATABASE_URL` | `pnpm db:migrate` e caixa pastoral (conexão **direta** do Neon, sem `-pooler`) |
| `TRIAGE_KEY_V1` (…`Vn`) | Caixa pastoral (decifra localmente) |
| `OPERATOR` | Identificação de quem lê dados na caixa pastoral (gravada em `audit_events`) |
| `TEST_DATABASE_URL` | Testes de integração — **somente** banco descartável (tabelas são truncadas) |

Os scripts leem o arquivo com `node --env-file=.env scripts/<script>.mjs`.
