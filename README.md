# purelife-docs — Documentação Canónica e Portal de Arquitetura

[![Documentation](https://img.shields.io/badge/Docs-GitHub%20Pages-044A82.svg)](https://purelifeministriesbrasil.github.io/documentation/)
[![Architecture](https://img.shields.io/badge/Architecture-Specification%20v5.0-success.svg)](./architecture/system-overview.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Security Policy](https://img.shields.io/badge/Security-Policy-red.svg)](./SECURITY.md)

Repositório central de documentação arquitetural, especificação de requisitos, registros de decisões de arquitetura (ADRs), runbooks operacionais, contratos de API e conformidade legal (LGPD) do ecossistema **Pure Life Ministries Brasil** (`purelifeministriesbrasil.org`).

Publicado nativamente via **GitHub Pages** utilizando o gerador dinâmico de documentação **Docsify**, com suporte a diagramas Mermaid e syntax highlighting para TypeScript, SQL, Bash, YAML e JSON.

---

## Índice de Navegação

### 1. Arquitetura e Engenharia de Software
- [**Visão Geral do Sistema e Topologia Multirepo**](architecture/system-overview.md): Mapeamento dos 6 repositórios (`purelife-web`, `purelife-api`, `purelife-cms`, `purelife-contracts`, `purelife-docs`, `purelife-infra`), fronteiras de Clean Architecture e isolamento absoluto de dados sensíveis.
- [**Especificação de Requisitos do Sistema (SRS)**](requirements/especificacao-requisitos-ecossistema.md): Mapeamento de personas, catálogo formal de requisitos funcionais (RF), regras de negócio (RN), requisitos não-funcionais (RNF), cenários BDD/Gherkin e matriz de rastreabilidade com diagrama ERD do Neon Postgres.

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
- [**Conformidade Legal e LGPD**](compliance/lgpd-compliance.md): Mapeamento de bases legais (Art. 11), consentimentos em transação atómica, retenção máxima de 180 dias e expurgo automatizado.

### 5. Contratos de Interface e Endpoints
- [**Especificação de Contratos de API**](api/api-contracts.md): Catálogo de endpoints do Worker, esquemas Zod estritos, request guards e rate limiting.

### 6. Operações e Deployment
- [**Guia Operacional de Deploy**](deployment/deployment-guide.md): Sequência de inicialização para Cloudflare Pages, Workers, Neon Postgres, Sanity Studio v3 e Terraform.

---

## Publicação no GitHub Pages

O portal de documentação é publicado automaticamente no GitHub Pages pelo workflow GitHub Actions [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) usando `actions/deploy-pages@v4`.

### Como Ativar o GitHub Pages no Repositório

Para ativar o deploy automatizado nas configurações do GitHub:
1. Acesse o repositório no GitHub: `https://github.com/purelifeministriesbrasil/documentation` (ou `purelife-docs`).
2. Clique na aba **Settings** (Configurações).
3. No menu lateral esquerdo, clique em **Pages** (sob a seção *Code and automation*).
4. Na seção **Build and deployment**:
   - Em **Source**, selecione **GitHub Actions**.
5. Salve as alterações.
6. A partir desse momento, qualquer `push` para a branch `main` dispara automaticamente o job de deploy do Docsify, servindo a documentação sem a necessidade de compilação estática complexa.

> [!NOTE]
> O arquivo [`.nojekyll`](.nojekyll) presente na raiz deste repositório é indispensável para evitar que o processador Jekyll do GitHub ignore diretórios e arquivos iniciados por sublinhado (como `_sidebar.md`).

### Pré-Visualização Local

Para visualizar a documentação localmente:
```bash
# Opção 1: Usando docsify-cli
npx docsify-cli serve .

# Opção 2: Usando qualquer servidor HTTP estático
npx serve .
# ou
python -m http.server 3000
```
Acesse `http://localhost:3000` no seu navegador.

---

## Governança e Contribuição

- [Código de Conduta](CODE_OF_CONDUCT.md)
- [Guia de Contribuição](CONTRIBUTING.md)
- [Política de Segurança e Divulgação Responsável](SECURITY.md)
- [Licença MIT](LICENSE)