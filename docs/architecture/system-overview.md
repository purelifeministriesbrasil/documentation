# Visão Geral do Sistema e Arquitetura

O sistema Pure Life Ministries Brasil adota uma arquitetura orientada a serviços leves e serverless, com separação rígida entre a camada de apresentação na borda, a API de regras de negócio/segurança e a camada de persistência confidencial.

---

## 1. Topologia do Sistema

```mermaid
flowchart TD
    subgraph Clients["Camada de Apresentação (Edge & Browser)"]
        Browser["Navegador do Usuário / Mobile"]
        VercelEdge["Vercel Edge Network (CDN Global)"]
        VercelProxy["Vercel Reverse Proxy (/api/*)"]
    end

    subgraph App["Frontend (Astro 5 SSG + React Islands)"]
        Pages["Páginas Estáticas Prerenderizadas (16 Rotas)"]
        Islands["Ilhas React Interativas (Formulários & State)"]
        ZodSchemas["Validação de Entrada com Zod"]
    end

    subgraph IntegrationLayer["Camada de API & Segurança (Cloudflare Workers)"]
        WorkerAPI["Hono API Serverless (Wrangler)"]
        Turnstile["Cloudflare Turnstile (Anti-Bot)"]
        CryptoProvider["Provedor AES-256-GCM + AAD"]
        AsaasGateway["Gateway Asaas (PIX Dinâmico)"]
        CronJob["Cloudflare Cron Trigger (0 3 * * * - Expurgo LGPD)"]
    end

    subgraph DataPlatform["Camada de Dados e Gestão (Supabase)"]
        PgBouncer["Supabase Transaction Pooler (Porta 6543)"]
        PostgresDB[(PostgreSQL 16 Gerenciado)]
        PastoralUI["Table Editor Visual / Dashboard Pastoral"]
    end

    Browser -->|Requisição HTTPS| VercelEdge
    VercelEdge -->|Cache Hit Instantâneo| Pages
    Browser -->|Hidratação Parcial| Islands
    Islands -->|Validação Local| ZodSchemas
    Islands -->|Submit via POST /api/*| VercelProxy
    VercelProxy -->|Proxy Reverso Seguro| WorkerAPI

    WorkerAPI -->|Validação de Token Anti-Bot| Turnstile
    WorkerAPI -->|Cifragem de Confissões/Contato| CryptoProvider
    WorkerAPI -->|Conexão TCP / Drizzle postgres.js| PgBouncer
    PgBouncer -->|Persistência Transacional Atômica| PostgresDB

    PastoralUI -->|Autenticação Segura 2FA| PostgresDB

    WorkerAPI -->|Cobrança PIX Dinâmico| AsaasGateway
    AsaasGateway -->|Webhook Assinado| WorkerAPI
    CronJob -->|Rotina Diária de Expurgo Criptográfico| PostgresDB
```

---

## 2. Componentes Principais

### A. Frontend Web (`frontend`)
- **Framework**: Astro 5 configurado com `output: 'static'`.
- **Estilização**: Tailwind CSS v4 com tokens unificados na folha global. Zero CSS inline para compliance estrito com Content Security Policy (`style-src 'self'`).
- **Acessibilidade & Movimento**: Respeito estrito a `prefers-reduced-motion: reduce`, atributos ARIA dinâmicos (`aria-live`, `role="alert"`, `aria-describedby`) e foco visível em todos os controles interativos.
- **Roteamento Seguro**: Zero dependências de clientes de banco de dados no bundle (`@supabase/supabase-js` erradicado). Todas as submissões trafegam via Vercel Reverse Proxy (`/api/*`) para o backend na Cloudflare.
- **Formulários Interativos**:
  - `TriageForm.tsx`: Triagem confidencial com consentimento de sigilo pastoral.
  - `ContactForm.tsx`: Formulário de contato institucional.
  - `DonationForm.tsx`: Intenção de doação com suporte a PIX dinâmico e tratamento de erros explícito.
  - `newsletter-enhance.ts`: Captação progressiva de informativos por e-mail com fallback sem JavaScript.

### B. Backend na Borda (`backend`)
- **Runtime**: Cloudflare Workers com `compatibility_flags = ["nodejs_compat"]`.
- **Roteador & Middlewares**: **Hono** gerenciando cabeçalhos de segurança OWASP (`secureHeaders`), controle rigoroso de CORS por ambiente e limites de payload por rota (`bodyLimit`).
- **Criptografia de Campo em Repouso**: Provedor AES-256-GCM com Dados Adicionais Autenticados (AAD vinculando `entityType`, `entityId`, `field` e `keyVersion`) para proteção de dados confidenciais (Art. 11 LGPD).
- **Proteção Anti-Bot**: Porta hexagonal `BotProtectionPort` acoplada ao Cloudflare Turnstile com limite de tempo (`AbortSignal.timeout(3000)`).
- **Driver de Persistência**: `postgres.js` com `drizzle-orm/postgres-js`, habilitando suporte nativo a transações atômicas interativas (`db.transaction`) via Supabase Transaction Pooler (porta 6543) com `prepare: false`.
- **Idempotência**: Processamento de webhooks de pagamento baseado no modelo de lease atômico.
- **Expurgo Criptográfico Agendado**: Cloudflare Cron Trigger executando diariamente às 03:00 UTC em lotes seguros (`LIMIT 500`) com nulificação de dados em conformidade com o Artigo 16 da LGPD.

### C. Plataforma de Dados (`Supabase`)
- **Segurança de Linha (RLS)**: Tabelas protegidas com políticas granulares.
- **Isolamento de Segredos**: O banco não é exposto diretamente à Internet pública para gravações desprotegidas; todas as gravações sensíveis passam pelo isolamento do Worker.
- **Painel Administrativo**: A equipe pastoral utiliza o painel administrativo com controle de acesso granular e auditoria para despachar atendimentos.
