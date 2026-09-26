# Variáveis de Ambiente e Configuração

O ecossistema adota o princípio de **segurança por padrão** e **configuração estrita em tempo de build e execução**. Nunca armazene credenciais de produção no controle de versão.

---

## 1. Frontend (`frontend/.env`)

O frontend consome variáveis públicas expostas pelo Astro através do prefixo `PUBLIC_`.

```dotenv
# ==============================================================================
# Pure Life Ministries Brasil — Variáveis de Ambiente do Frontend
# ==============================================================================

# Origem pública do site em produção
PUBLIC_SITE_ORIGIN=https://purelifebrasil.org

# Supabase (Plataforma de Dados)
# Obtido em: Painel Supabase -> Project Settings -> API
PUBLIC_SUPABASE_URL=https://exemplo-seu-projeto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cloudflare Turnstile (Proteção Anti-Bot)
# Use chaves de teste da Cloudflare em desenvolvimento:
# Sitekey de teste: 1x00000000000000000000AA
PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

!!! warning "Aviso de Segurança: Nunca utilize a Chave `service_role` no Frontend"
    Apenas a chave **`anon` (pública)** deve ser configurada no frontend. A chave `service_role` concede acesso irrestrito ao banco e ignora o Row Level Security (RLS). A inserção da chave `service_role` no frontend constitui vulnerabilidade crítica de segurança.

---

## 2. Backend (`backend/wrangler.toml` ou Secrets)

O backend Worker gerencia webhooks de pagamento e rotinas assíncronas:

```dotenv
# Origem permitida para requisições CORS
PUBLIC_SITE_ORIGIN=https://purelifebrasil.org

# Ambiente de execução
ENVIRONMENT=production

# Chave Criptográfica AES-256 (32 bytes em Base64) para expurgo/validação pastoral
TRIAGE_KEY_V1=base64_encoded_32_bytes_key_here...

# Gateway de Pagamento Asaas (PIX)
ASAAS_API_KEY=$aact_YTU5Y...
ASAAS_WEBHOOK_SECRET=segredo_webhook_asaas...

# Cloudflare Turnstile Secret Key (Server-Side)
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

---

## 3. Configuração de Variáveis na Vercel

Ao conectar o repositório `frontend` à **Vercel**:

1. Acesse o painel da Vercel: `Project Settings` > `Environment Variables`.
2. Adicione as variáveis:
   - `PUBLIC_SUPABASE_URL`: sua URL do projeto Supabase.
   - `PUBLIC_SUPABASE_ANON_KEY`: sua chave anônima do Supabase.
   - `PUBLIC_TURNSTILE_SITE_KEY`: sua chave do Cloudflare Turnstile.
3. Marque os ambientes apropriados: `Production`, `Preview` e `Development`.
4. Dispare um novo deploy para que as variáveis sejam injetadas no build.
