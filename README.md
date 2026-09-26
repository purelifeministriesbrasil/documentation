# purelife-docs — Documentação Técnica & Portal de Arquitetura

<p align="center">
  <img src="docs/assets/images/PLM_Logo.png" alt="Pure Life Ministries Brasil" width="100" />
</p>

[![Documentation](https://img.shields.io/badge/Docs-MkDocs%20Material-044A82.svg)](https://purelifeministriesbrasil.github.io/documentation/)
[![Architecture](https://img.shields.io/badge/Architecture-Canonical%20Architecture-success.svg)](./docs/architecture/system-overview.md)
[![Security Policy](https://img.shields.io/badge/Security-AES--256--GCM%20%2B%20AAD-059669.svg)](./docs/security/threat-model.md)
[![Compliance](https://img.shields.io/badge/LGPD-Art.%2011%20Compliant-blue.svg)](./docs/security/lgpd-compliance.md)
[![Accessibility](https://img.shields.io/badge/A11y-WCAG%20AAA-success.svg)](./docs/assets/stylesheets/extra.css)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./docs/governance/license.md)

Repositório canônico de documentação arquitetural, especificações formais de requisitos (SRS), registros de decisões de arquitetura (ADRs 001 a 005), runbooks operacionais, contratos de dados e conformidade com a LGPD (Art. 11 — Dados Sensíveis) do ecossistema digital da **Pure Life Ministries Brasil** (`purelifeministriesbrasil.org`).

Construído e publicado com **Material for MkDocs**, apresentando tipografia canônica Montserrat e JetBrains Mono, paleta de alto contraste com suporte total aos modos claro e escuro (WCAG AAA), navegação superior centralizada e estrita conformidade com acessibilidade.

---

## 1. Princípios Arquiteturais e Fronteiras

O ecossistema opera sob a regra de ouro de isolamento de responsabilidades:
> **"Front com Front, Back com Back e Docs com Docs."**

| Repositório | Responsabilidade | Stack Principal | Hospedagem |
|---|---|---|---|
| **`frontend`** | Interface pública, páginas institucionais e ilhas interativas | Astro v5 SSG, Tailwind CSS v4, React 19, Supabase Client | Vercel Edge |
| **`backend`** | API de borda, gateways de pagamento, criptografia e rotinas cron | Cloudflare Worker, Clean Architecture, Supabase Postgres, Drizzle ORM | Cloudflare Network |
| **`documentation`** | Portal central de especificações técnicas, ADRs, runbooks e governança | Material for MkDocs, PyMdown Extensions, Mermaid.js | GitHub Pages |

---

## 2. Estrutura de Diretórios

```
documentation/
├── mkdocs.yml                  # Configuração declarativa do MkDocs e da navegação por abas
├── requirements.txt            # Dependências Python (mkdocs-material, pymdown-extensions)
├── docs/                       # Conteúdo técnico em Markdown
│   ├── index.md                # Visão Geral e portal do engenheiro
│   ├── assets/                 # Logotipos institucionais, favicons e folhas de estilo CSS
│   │   ├── images/             # Ativos visuais (PLM_Logo.png, favicon.png)
│   │   └── stylesheets/        # extra.css (Regras canônicas de contraste e layout centralizado)
│   ├── adrs/                   # Architecture Decision Records (ADR-001 a ADR-005)
│   ├── architecture/           # Topologia, diagramas de sequência, modelo de dados e escopos
│   ├── design-system/          # Sistema de design, cores corporativas e tipografia
│   ├── getting-started/        # Guias de início rápido e variáveis de ambiente
│   ├── glossary/               # Glossário ubíquo de domínio e engenharia
│   ├── governance/             # Código de conduta, diretrizes de contribuição e licença
│   ├── operations/             # Runbooks de deploy, observabilidade, backup e rotação de chaves
│   ├── requirements/           # Especificação formal de requisitos (SRS) e regras de negócio
│   ├── schemas/                # Documentação técnica dos contratos Zod e cargas úteis
│   └── security/               # Modelagem STRIDE, conformidade LGPD e arquitetura criptográfica
└── .github/
    └── workflows/
        └── deploy-pages.yml    # Pipeline de validação estrita e publicação no GitHub Pages
```

---

## 3. Como Executar Localmente

### Pré-requisitos
- Python 3.11+
- `uv` (recomendado) ou `pip` tradicional

### Opção A: Utilizando `uv` (Rápido e Isolado)

```bash
# Executar servidor de desenvolvimento local (http://127.0.0.1:8000)
uv run --with-requirements requirements.txt mkdocs serve

# Executar compilação com validação estrita (idêntica à esteira de CI)
uv run --with-requirements requirements.txt mkdocs build --strict
```

### Opção B: Utilizando Ambiente Virtual Padrão (`venv`)

```bash
# Criar ambiente virtual
python -m venv .venv

# Ativar ambiente virtual
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Linux / macOS:
source .venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Iniciar servidor local
mkdocs serve

# Validar compilação estrita
mkdocs build --strict
```

---

## 4. Publicação e CI/CD

O portal é compilado e publicado automaticamente no GitHub Pages a cada push na branch `main` através do workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml). Qualquer aviso ou link quebrado faz a esteira falhar imediatamente (`--strict`), assegurando integridade total da documentação.

---

## 5. Governança e Contribuição

- [Código de Conduta](docs/governance/code-of-conduct.md)
- [Diretrizes de Contribuição](docs/governance/contributing.md)
- [Política de Segurança](docs/governance/security-policy.md)
- [Licença MIT](docs/governance/license.md)