# Guia Operacional de Deploy (Vercel & Cloudflare Workers)

O ecossistema Pure Life Ministries Brasil adota uma esteira de deploy desacoplada e resiliente, com o frontend hospedado na **Vercel** e a API/Backend nos **Cloudflare Workers**.

---

## 1. Deploy do Frontend na Vercel

O frontend do portal é publicado na **Vercel** via compilação estática pura no Astro 5.

### 1.1. Conexão do Repositório
1. Acesse o painel da Vercel em [vercel.com](https://vercel.com).
2. Clique em **Add New...** > **Project**.
3. Importe o repositório GitHub: `purelifeministriesbrasil/frontend`.
4. Defina as configurações de build:
   - **Framework Preset**: `Astro`
   - **Root Directory**: `./`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install --frozen-lockfile`

### 1.2. Variáveis de Ambiente no Frontend
Na seção **Environment Variables**, adicione apenas as variáveis públicas necessárias:

| Chave | Descrição | Escopo |
| :--- | :--- | :--- |
| `PUBLIC_SITE_ORIGIN` | URL canônica do site (`https://purelifebrasil.org`) | Production, Preview |
| `PUBLIC_TURNSTILE_SITE_KEY` | Chave pública do Cloudflare Turnstile (`0x4AAAAAAA...`) | Production, Preview |

> [!NOTE]
> As variáveis `PUBLIC_SUPABASE_URL` e `PUBLIC_SUPABASE_ANON_KEY` foram descontinuadas no frontend. Todo o tráfego de dados sensíveis é encaminhado ao backend via Proxy Reverso.

### 1.3. Proxy Reverso e Segurança (`vercel.json`)
O arquivo `vercel.json` encaminha automaticamente chamadas `/api/:path*` para o Cloudflare Worker (`https://api.purelifebrasil.org/api/:path*`) e aplica cabeçalhos de segurança (CSP, HSTS, no-store em rotas de triagem).

---

## 2. Deploy do Backend na Cloudflare Workers

O backend opera como um Cloudflare Worker baseado em Hono e Drizzle ORM.

### 2.1. Configuração do `wrangler.toml`
O arquivo `wrangler.toml` define o ponto de entrada, compatibilidade e agendamentos:
```toml
name = "purelife-api"
main = "src/index.ts"
compatibility_date = "2026-09-19"
compatibility_flags = ["nodejs_compat"]

[vars]
PUBLIC_SITE_ORIGIN = "https://purelifebrasil.org"
ENVIRONMENT = "production"

[triggers]
crons = ["0 3 * * *"]
```

### 2.2. Injeção de Segredos de Produção (Cloudflare Secrets)
Os segredos **jamais** devem ser commitados no repositório. Configure-os via CLI do Wrangler:

```bash
# Conexão com o Supabase Transaction Pooler (porta 6543)
pnpm wrangler secret put DATABASE_URL

# Chave simétrica primária para cifragem de triagens (32 bytes em base64)
pnpm wrangler secret put TRIAGE_KEY_V1

# Chave secreta do Cloudflare Turnstile
pnpm wrangler secret put TURNSTILE_SECRET_KEY

# Credenciais do Gateway Asaas (PIX)
pnpm wrangler secret put ASAAS_API_KEY
pnpm wrangler secret put ASAAS_WEBHOOK_SECRET

# Chave de envio transacional de e-mails
pnpm wrangler secret put RESEND_API_KEY
```

### 2.3. Execução do Deploy
Para publicar uma nova versão em produção:
```bash
pnpm wrangler deploy
```

---

## 3. Configuração de DNS & Domínios

1. **Frontend (`purelifebrasil.org`)**:
   - Registro A apontando para a Vercel (`76.76.21.21`).
   - CNAME `www` apontando para `cname.vercel-dns.com`.
2. **API (`api.purelifebrasil.org`)**:
   - Rota de Cloudflare Worker mapeando `api.purelifebrasil.org/*` para o worker `purelife-api`.
