# purelife-docs — Documentação Canónica e Portal de Arquitetura

[![Documentation](https://img.shields.io/badge/Docs-Mintlify-0284C7.svg)](https://mintlify.com)
[![Architecture](https://img.shields.io/badge/Architecture-Specification%20v5.0-success.svg)](./architecture/system-overview.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Security Policy](https://img.shields.io/badge/Security-Policy-red.svg)](./SECURITY.md)

Repositório central de documentação arquitetural, registros de decisões de arquitetura (ADRs), runbooks operacionais, contratos de API e conformidade legal (LGPD) do ecossistema **Pure Life Ministries Brasil** (`purelifebrasil.org`).

Desenvolvido para publicação instantânea e sincronizada com Git através do **[Mintlify](https://mintlify.com)** via `mint.json`.

---

## 📚 Índice de Navegação

### 1. Arquitetura e Engenharia de Software
- [**Visão Geral do Sistema e Topologia Multirepo**](architecture/system-overview.md): Mapeamento dos 6 repositórios (`frontend`, `backend`, `cms`, `contracts`, `documentation`, `infra`), fronteiras de Clean Architecture e isolamento absoluto de dados sensíveis.

### 2. Registros de Decisões de Arquitetura (ADRs)
- [**ADR-001: Adoção de Astro SSG e Descarte de SPA React Monolítica**](adrs/ADR-001-astro-ssg.md)
- [**ADR-002: Isolamento Absoluto entre Conteúdo Editorial (Sanity) e Dados Sensíveis (Neon)**](adrs/ADR-002-isolamento-sanity-neon.md)
- [**ADR-003: Infraestrutura de Borda como Código (Cloudflare via Terraform)**](adrs/ADR-003-seguranca-borda-cloudflare-terraform.md)
- [**ADR-004: Cifra de Campo em Repouso com AES-256-GCM e AAD Rígido**](adrs/ADR-004-criptografia-aes-gcm-aad.md)
- [**ADR-005: Modelo de Lease Atómico para Idempotência de Webhooks**](adrs/ADR-005-modelo-lease-idempotencia.md)

### 3. Runbooks Operacionais
- [**Rotação de Chaves Criptográficas e Custódia Segura**](runbooks/key-rotation.md): Procedimento para rotação periódica de chaves AES-256, Cloudflare Secrets e segredos de ambiente.
- [**Recuperação de Desastres (DR) e Métricas RPO/RTO**](runbooks/disaster-recovery.md): Contingência para o Neon Postgres, Point-in-time recovery e metas de RPO/RTO $\le$ 1 hora.

### 4. Segurança, Privacidade e LGPD
- [**Conformidade Legal e LGPD**](compliance/lgpd-compliance.md): Mapeamento de bases legais, consentimentos em transação atómica, retenção máxima de 180 dias e expurgo automatizado.

### 5. Contratos de Interface e Endpoints
- [**Especificação de Contratos de API**](api/api-contracts.md): Catálogo de endpoints do Worker, esquemas Zod estritos, request guards e rate limiting.

### 6. Operações e Deployment
- [**Guia Operacional de Deploy**](deployment/deployment-guide.md): Sequência de inicialização para Cloudflare Pages, Workers, Neon Postgres, Sanity Studio v3 e Terraform.

---

## 🚀 Publicação no Mintlify

Este repositório está configurado nativamente com `mint.json`. Para publicar a documentação oficial:
1. Acesse o [Dashboard do Mintlify](https://dashboard.mintlify.com/).
2. Conecte sua organização GitHub e selecione o repositório `purelifeministriesbrasil/purelife-docs`.
3. O Mintlify detectará o arquivo `mint.json` automaticamente e disponibilizará o portal sob o subdomínio gerado ou configurável como `docs.purelifebrasil.org`.
4. Qualquer push para a branch `main` atualiza o portal em segundos, sem necessidade de pipelines complexos de CI/CD ou permissões de Pages.

Para pré-visualização local:
```bash
npm i -g mintlify
mintlify dev
```

---

## 🛡️ Governança e Contribuição

- [Código de Conduta](CODE_OF_CONDUCT.md)
- [Guia de Contribuição](CONTRIBUTING.md)
- [Política de Segurança e Divulgação Responsável](SECURITY.md)
- [Licença MIT](LICENSE)