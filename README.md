# purelife-docs — Documentação Canónica e Portal de Arquitetura

[![Documentation](https://img.shields.io/badge/Docs-GitHub%20Pages-044A82.svg)](https://purelifeministriesbrasil.github.io/documentation/)
[![Architecture](https://img.shields.io/badge/Architecture-Specification%20v5.0-success.svg)](./architecture/system-overview.md)
[![Security Policy](https://img.shields.io/badge/Security-AES--256--GCM%20%2B%20AAD-059669.svg)](./security/threat-model.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Compliance](https://img.shields.io/badge/LGPD-Art.%2011%20Compliant-blue.svg)](./compliance/lgpd-compliance.md)

Repositório central de documentação arquitetural, especificação formal de requisitos, registros de decisões de arquitetura (ADRs), runbooks operacionais, contratos de API, modelagem de ameaças e conformidade legal (LGPD) do ecossistema **Pure Life Ministries Brasil** (`purelifeministriesbrasil.org`).

Publicado nativamente via **GitHub Pages** utilizando o gerador dinâmico de documentação **Docsify**, com tipografia editorial (*Inter*, *Newsreader*, *JetBrains Mono*), paleta canónica `#044A82`, suporte a diagramas Mermaid, abas interativas de código (*Docsify Tabs*), paginação contínua e realce de sintaxe para TypeScript, SQL, Bash, YAML, Markdown, JSON e Python.

---

## Índice Estruturado de Navegação

### 1. Arquitetura e Engenharia de Software
- [**Visão Geral do Sistema e Topologia Multirepo**](architecture/system-overview.md): Mapeamento dos 6 repositórios (`purelife-web`, `purelife-api`, `purelife-cms`, `purelife-contracts`, `purelife-docs`, `purelife-infra`), métricas SLO/SLA, fronteiras de Clean Architecture e isolamento absoluto de dados sensíveis.
- [**Diagramas de Sequência Canónicos**](architecture/sequence-diagrams.md): Quatro fluxos detalhados em Mermaid cobrindo triagem com cifra AES-GCM + AAD, upload seguro de diplomas para o Cloudflare R2, doação Pix com lock de idempotência e cron diário de expurgo LGPD.

### 2. Registros de Decisões de Arquitetura (ADRs)
- [**ADR-001: Adoção de Astro SSG e Descarte de SPA React Monolítica**](adrs/ADR-001-astro-ssg.md)
- [**ADR-002: Isolamento Absoluto entre Conteúdo Editorial (Sanity) e Dados Sensíveis (Neon)**](adrs/ADR-002-isolamento-sanity-neon.md)
- [**ADR-003: Infraestrutura de Borda como Código (Cloudflare via Terraform)**](adrs/ADR-003-seguranca-borda-cloudflare-terraform.md)
- [**ADR-004: Cifra de Campo em Repouso com AES-256-GCM e AAD Rígido**](adrs/ADR-004-criptografia-aes-gcm-aad.md)
- [**ADR-005: Modelo de Lease Atómico para Idempotência de Webhooks**](adrs/ADR-005-modelo-lease-idempotencia.md)

### 3. Requisitos, Governança e AppSec
- [**Especificação de Requisitos do Sistema (SRS)**](requirements/especificacao-requisitos-ecossistema.md): Mapeamento de 5 personas (`PER-001` a `PER-005`), catálogo tabular de 25 requisitos funcionais (MoSCoW), 9 regras de negócio canónicas, cenários BDD/Gherkin e matriz de rastreabilidade com ERD do Neon Postgres.
- [**Conformidade Legal e LGPD**](compliance/lgpd-compliance.md): Mapeamento de bases legais (Art. 11), consentimentos em transação atómica, retenção máxima de 180 dias e canal do titular.
- [**Modelagem de Ameaças & AppSec Playbook (STRIDE & DREAD)**](security/threat-model.md): Identificação de ativos críticos (*Crown Jewels*), fronteiras de confiança, matriz STRIDE de mitigação e matriz DREAD de cálculo de risco.

### 4. Guias de Engenharia e Design System
- [**Guia do Desenvolvedor (Quickstart)**](guides/developer-quickstart.md): Instruções passo a passo para setup local multirepo em 5 minutos, variáveis de ambiente seguras, execução de testes e checklist de PR.
- [**Design System & Guia de Estilo e Tom de Voz**](design/design-system.md): Paleta de cores oficial (`#044A82`, `#032D50`, `#F5F2EC`, `#C99A45`), contraste WCAG AAA, escala tipográfica, iconografia `lucide-react` e diretrizes de comunicação pastoral.
- [**Glossário Canónico de Domínio (DDD)**](glossary/glossary.md): Vocabulário ubíquo integrando termos bíblico-pastorais (Aconselhamento Bíblico, Admissão, Trauma de Traição, Sigilo Pastoral) e termos de engenharia (AAD, AES-GCM, Astro SSG, Zero-JS, Lease de Idempotência).

### 5. Contratos de Interface e APIs
- [**Especificação de Contratos de API**](api/api-contracts.md): Catálogo interativo de endpoints com abas de código para cURL, TypeScript (Fetch API), respostas de sucesso e erro, e request guards na borda.

### 6. Runbooks e Operações
- [**Cheat Sheet Operacional (CLI)**](runbooks/cli-cheatsheet.md): Referência rápida de comandos práticos para Vitest, Cloudflare Wrangler, Drizzle ORM, Astro e auditoria de segredos.
- [**Rotação de Chaves Criptográficas e Custódia Segura**](runbooks/key-rotation.md): Procedimento para rotação periódica de chaves AES-256, Cloudflare Secrets e segredos de ambiente.
- [**Recuperação de Desastres (DR) e Métricas RPO/RTO**](runbooks/disaster-recovery.md): Contingência para o Neon Postgres, Point-in-time recovery e metas de RPO/RTO $\le$ 1 hora.
- [**Guia Operacional de Deploy**](deployment/deployment-guide.md): Sequência de inicialização para Cloudflare Pages, Workers, Neon Postgres, Sanity Studio v3 e Terraform.

---

## Publicação no GitHub Pages

O portal de documentação é publicado automaticamente no GitHub Pages pelo workflow GitHub Actions [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) usando `actions/deploy-pages@v4`.

### Como Ativar o GitHub Pages no Repositório

1. Acesse o repositório no GitHub: `https://github.com/purelifeministriesbrasil/documentation` (ou `purelife-docs`).
2. Clique na aba **Settings** (Configurações).
3. No menu lateral esquerdo, clique em **Pages** (sob a seção *Code and automation*).
4. Na seção **Build and deployment**:
   - Em **Source**, selecione **GitHub Actions**.
5. Salve as alterações.
6. A partir desse momento, qualquer `push` para a branch `main` dispara automaticamente o job de deploy do Docsify, servindo a documentação sem a necessidade de compilação estática complexa.

> [!NOTE]
> O arquivo [`.nojekyll`](.nojekyll) presente na raiz deste repositório é indispensável para evitar que o processador Jekyll do GitHub ignore diretórios e arquivos iniciados por sublinhado (como `_sidebar.md` e `_coverpage.md`).

### Pré-Visualização Local

Para visualizar a documentação localmente:
```bash
# Opção 1: Usando qualquer servidor HTTP estático
npx serve . -p 3000

# Opção 2: Usando docsify-cli
npx docsify-cli serve .
```
Acesse `http://localhost:3000` no seu navegador.

---

## Governança e Contribuição

- [Código de Conduta](CODE_OF_CONDUCT.md)
- [Guia de Contribuição](CONTRIBUTING.md)
- [Política de Segurança e Divulgação Responsável](SECURITY.md)
- [Licença MIT](LICENSE)