# Variáveis de Ambiente e Configuração

O ecossistema adota o princípio de **segurança por padrão** e **configuração estrita em tempo de build e execução**. Nunca armazene credenciais de produção no controle de versão.

---

## 1. Frontend (`frontend/.env` ou Vercel)

O frontend consome variáveis públicas expostas pelo Astro através do prefixo `PUBLIC_`. Devido à arquitetura endurecida que elimina o acesso direto do cliente ao banco de dados, o frontend requer apenas credenciais públicas de apresentação e proteção anti-bot.

```dotenv
# ==============================================================================
# Pure Life Ministries Brasil — Variáveis de Ambiente do Frontend
# ==============================================================================

# Origem pública do site em produção
PUBLIC_SITE_ORIGIN=https://purelifebrasil.org

# Cloudflare Turnstile (Proteção Anti-Bot)
# Use chaves de teste da Cloudflare em desenvolvimento:
# Sitekey de teste: 1x00000000000000000000AA
PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

> [!NOTE]
> As variáveis `PUBLIC_SUPABASE_URL` e `PUBLIC_SUPABASE_ANON_KEY` foram removidas do frontend para prevenir bypass de segurança. Toda comunicação com dados transita via API do backend.

---

## 2. Backend (`backend/wrangler.toml` e Wrangler Secrets)

O backend Worker gerencia a lógica de negócio, criptografia em repouso e conexão com o PostgreSQL do Supabase:

### 2.1. Variáveis Públicas de Ambiente (`wrangler.toml`)
```toml
[vars]
PUBLIC_SITE_ORIGIN = "https://purelifebrasil.org"
ENVIRONMENT = "production"
```

### 2.2. Segredos Criptográficos e de Conexão (`wrangler secret put <NOME>`)
Os seguintes segredos devem ser configurados no Cloudflare Workers:

| Segredo | Descrição |
| :--- | :--- |
| `DATABASE_URL` | String de conexão PostgreSQL do Supabase (Pooler na porta 6543) |
| `TRIAGE_KEY_V1` | Chave de 32 bytes em Base64 para cifragem simétrica AES-256-GCM |
| `TURNSTILE_SECRET_KEY` | Chave secreta de validação do Cloudflare Turnstile (server-side) |
| `ASAAS_API_KEY` | Chave de API do gateway Asaas para emissão de PIX dinâmico |
| `ASAAS_WEBHOOK_SECRET` | Segredo para validação de assinatura dos webhooks de pagamento |
| `RESEND_API_KEY` | Chave de API para envio transacional de e-mails via Resend |

---

## 3. Configuração de Variáveis na Vercel

Ao conectar o repositório `frontend` à **Vercel**:

1. Acesse o painel da Vercel: `Project Settings` > `Environment Variables`.
2. Adicione as variáveis:
   - `PUBLIC_SITE_ORIGIN`: `https://purelifebrasil.org`
   - `PUBLIC_TURNSTILE_SITE_KEY`: sua chave de site do Cloudflare Turnstile.
3. Marque os ambientes apropriados: `Production`, `Preview` e `Development`.
4. Dispare um novo deploy para que as variáveis sejam injetadas no build.
