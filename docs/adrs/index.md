# Registros de Decisões de Arquitetura (ADRs)

Os **Architecture Decision Records (ADRs)** capturam as decisões arquiteturais fundamentais tomadas durante o ciclo de vida e modernização do projeto, incluindo contexto, alternativas avaliadas, justificativas técnicas e consequências.

---

## Índice de Decisões Canónicas

| ADR | Título | Status | Data |
| :--- | :--- | :---: | :---: |
| [**ADR-001**](ADR-001-astro-ssg-tailwind.md) | Adoção do Astro 5 com SSG e Tailwind CSS v4 | **Aprovado** | 2026-09-24 |
| [**ADR-002**](ADR-002-supabase-plataforma-dados.md) | Adoção do Supabase como Plataforma de Dados e Gestão Pastoral | **Aprovado** | 2026-09-25 |
| [**ADR-003**](ADR-003-vercel-hospedagem-borda.md) | Hospedagem e CDN de Alta Performance na Vercel | **Aprovado** | 2026-09-25 |
| [**ADR-004**](ADR-004-criptografia-aes-gcm-aad.md) | Criptografia de Campo em Repouso com AES-256-GCM e AAD | **Aprovado** | 2026-09-24 |
| [**ADR-005**](ADR-005-modelo-lease-idempotencia.md) | Modelo de Lease Atómico para Idempotência de Webhooks | **Aprovado** | 2026-09-24 |

---

## Estrutura Padrão de um ADR

Todo ADR no projeto segue rigorosamente o formato canónico:

- **Status**: Proposto, Aprovado, Rejeitado, Substituído ou Obsoleto.
- **Contexto**: A motivação do problema e as restrições de negócio/técnicas.
- **Decisão**: A solução escolhida e a forma de implementação.
- **Alternativas Consideradas**: O que foi avaliado e por que foi descartado.
- **Consequências**: Os impactos positivos (benefícios) e trade-offs assumidos.
