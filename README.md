# purelife-docs — Documentação Técnica & Portal de Arquitetura

<p align="center">
  <img src="docs/assets/images/PLM_Logo.png" alt="Pure Life Ministries Brasil" width="100" />
</p>

[![Documentation](https://img.shields.io/badge/Docs-MkDocs%20Material-044A82.svg)](https://purelifeministriesbrasil.github.io/documentation/)
[![Architecture](https://img.shields.io/badge/Architecture-Specification%20v5.0-success.svg)](./docs/architecture/system-overview.md)
[![Security Policy](https://img.shields.io/badge/Security-AES--256--GCM%20%2B%20AAD-059669.svg)](./docs/security/threat-model.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./docs/governance/license.md)
[![Compliance](https://img.shields.io/badge/LGPD-Art.%2011%20Compliant-blue.svg)](./docs/security/lgpd-compliance.md)

Repositório central de documentação arquitetural, especificação formal de requisitos, registros de decisões de arquitetura (ADRs), runbooks operacionais, contratos de dados e conformidade legal (LGPD) do ecossistema **Pure Life Ministries Brasil** (`purelifebrasil.org`).

Construído e publicado com **MkDocs** e o tema **Material for MkDocs**, com suporte a abas de código, diagramas Mermaid, busca instantânea e alternância entre modos claro e escuro.

---

## Como Executar Localmente

### 1. Pré-requisitos
- Python 3.11+ instalado.

### 2. Configuração e Inicialização

```bash
# Clone o repositório
git clone https://github.com/purelifeministriesbrasil/documentation.git
cd documentation

# Crie e ative o ambiente virtual
python -m venv .venv

# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Linux / macOS:
source .venv/bin/activate

# Instale as dependências
pip install -r requirements.txt

# Inicie o servidor local de desenvolvimento
mkdocs serve
```

Acesse no navegador: `http://127.0.0.1:8000`.

---

## Estrutura de Diretórios

```
documentation/
├── mkdocs.yml                  # Configuração do MkDocs Material
├── requirements.txt            # Dependências Python
├── docs/                       # Diretório de conteúdo Markdown
│   ├── index.md                # Visão Geral
│   ├── assets/                 # Logotipos oficiais, favicons e CSS customizado
│   ├── getting-started/        # Guia do Desenvolvedor e Setup
│   ├── architecture/           # Topologia, Diagramas e Modelo de Dados
│   ├── adrs/                   # Architecture Decision Records
│   ├── schemas/                # Esquemas Zod e Contratos
│   ├── security/               # Modelagem de Ameaças, LGPD e Criptografia
│   ├── design-system/          # Identidade Visual e Tipografia
│   ├── operations/             # Deploys, Backups e Runbooks
│   └── governance/             # Código de Conduta, Contribuição e Licença
└── .github/
    └── workflows/
        └── deploy-pages.yml    # Pipeline de publicação no GitHub Pages
```

---

## Publicação no GitHub Pages

O portal é compilado e publicado automaticamente a cada push na branch `main` através do workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) usando `actions/deploy-pages@v4`.