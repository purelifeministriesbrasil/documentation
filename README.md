# purelife-docs — Documentação Canónica e Portal de Arquitetura

Repositório central de documentação arquitetural, registros de decisões de arquitetura (ADRs), runbooks operacionais e conformidade legal do ecossistema **Pure Life Ministries Brasil** (`purelifebrasil.org`).

Publicado automaticamente via **GitHub Pages** a partir deste repositório.

---

## 📚 Índice de Conteúdo

### 1. Arquitetura e Engenharia de Software
- [**Visão Geral do Sistema e Topologia Multirepo**](architecture/system-overview.md): Mapeamento dos 6 repositórios (`frontend`, `backend`, `cms`, `contracts`, `documentation`, `infra`), fronteiras de Clean Architecture e isolamento de dados.

### 2. Registros de Decisões de Arquitetura (ADRs)
- [**ADR-001: Adoção de Astro SSG e Descarte de SPA React Monolítica**](adrs/ADR-001-astro-ssg.md)
- [**ADR-002: Isolamento Absoluto entre Conteúdo Editorial (Sanity) e Dados Sensíveis (Neon)**](adrs/ADR-002-isolamento-sanity-neon.md)
- [**ADR-003: Infraestrutura de Borda como Código (Cloudflare via Terraform)**](adrs/ADR-003-seguranca-borda-cloudflare-terraform.md)
- [**ADR-004: Cifra de Campo em Repouso com AES-256-GCM e AAD Rígido**](adrs/ADR-004-criptografia-aes-gcm-aad.md)
- [**ADR-005: Modelo de Lease Atómico para Idempotência de Webhooks**](adrs/ADR-005-modelo-lease-idempotencia.md)

### 3. Runbooks Operacionais
- [**Rotação de Chaves Criptográficas e Custódia Segura**](runbooks/key-rotation.md): Procedimento para rotação anual de chaves AES-256, Cloudflare Secrets e backup em cofre físico/digital.
- [**Recuperação de Desastres (DR) e Métricas RPO/RTO**](runbooks/disaster-recovery.md): Contingência para o Neon Postgres, Point-in-time recovery e metas de RPO/RTO de 1 hora.

### 4. Segurança, Privacidade e LGPD
- [**Conformidade Legal e LGPD**](compliance/lgpd-compliance.md): Mapeamento de bases legais, consentimentos em transação atómica, retenção máxima de 180 dias e expurgo automatizado.

### 5. Contratos de Interface e Endpoints
- [**Especificação de Contratos de API**](api/api-contracts.md): Catálogo de endpoints do Worker, esquemas Zod estritos, request guards e rate limiting.

### 6. Operações e Deployment
- [**Guia Operacional de Deploy**](deployment/deployment-guide.md): Sequência de inicialização para Cloudflare Pages, Workers, Neon, Sanity e Terraform.