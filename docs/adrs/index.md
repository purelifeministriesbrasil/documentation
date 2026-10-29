# Registros de Decisões de Arquitetura (ADRs)

Os **Architecture Decision Records (ADRs)** capturam as decisões arquiteturais fundamentais tomadas durante o ciclo de vida e modernização do projeto, incluindo contexto, alternativas avaliadas, justificativas técnicas e consequências.

---

## Índice de Decisões

| ADR | Título | Status | Data |
| :--- | :--- | :---: | :---: |
| [**ADR-001**](ADR-001-astro-ssg-tailwind.md) | Adoção do Astro 5 com SSG e Tailwind CSS v4 | **Aprovado** | 2026-09-24 |
| [**ADR-002**](ADR-002-supabase-plataforma-dados.md) | Adoção do Supabase como Plataforma de Dados e Gestão Pastoral | **Substituído** (ADR-008) | 2026-09-25 |
| [**ADR-003**](ADR-003-vercel-hospedagem-borda.md) | Hospedagem e CDN de Alta Performance na Vercel | **Substituído** (ADR-007) | 2026-09-25 |
| [**ADR-004**](ADR-004-criptografia-aes-gcm-aad.md) | Criptografia de Campo em Repouso com AES-256-GCM e AAD | **Aprovado** | 2026-09-24 |
| [**ADR-005**](ADR-005-modelo-lease-idempotencia.md) | Modelo de Lease Atômico para Idempotência de Webhooks | **Aprovado** | 2026-09-24 |
| [**ADR-006**](ADR-006-modernizacao-workers-hono-supabase.md) | Modernização em Cloudflare Workers com Hono, Drizzle e Supabase | **Aprovado** | 2026-09-29 |
| [**ADR-007**](ADR-007-cloudflare-pages-contas-institucionais.md) | Frontend no Cloudflare Pages e migração para contas institucionais | **Aprovado** | 2026-10-13 |
| [**ADR-008**](ADR-008-neon-hyperdrive.md) | Banco no Neon Postgres com Cloudflare Hyperdrive | **Aprovado** | 2026-10-28 |
| [**ADR-009**](ADR-009-performance-ilhas-preact-imagens.md) | Performance: ilhas em Preact, `zod/mini` e imagens responsivas | **Aprovado** | 2026-10-15 |

---

## Estrutura Padrão de um ADR

Todo ADR no projeto segue o formato padrão:

- **Status**: Proposto, Aprovado, Rejeitado, Substituído ou Obsoleto.
- **Contexto**: A motivação do problema e as restrições de negócio/técnicas.
- **Decisão**: A solução escolhida e a forma de implementação.
- **Alternativas Consideradas**: O que foi avaliado e por que foi descartado.
- **Consequências**: Os impactos positivos (benefícios) e trade-offs assumidos.
