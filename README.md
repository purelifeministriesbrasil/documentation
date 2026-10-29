<p align="center">
  <img src="docs/assets/images/PLM_Logo.png" alt="Pure Life Ministries Brasil" width="96" />
</p>

<h1 align="center">purelife-docs</h1>

<p align="center">
  Documentação técnica do ecossistema digital do <strong>Pure Life Ministries Brasil</strong>
</p>

<p align="center">
  <a href="https://purelifeministriesbrasil.github.io/documentation/"><img src="https://img.shields.io/badge/Docs-online-044A82.svg" alt="Documentação online" /></a>
  <a href="https://squidfunk.github.io/mkdocs-material/"><img src="https://img.shields.io/badge/MkDocs-Material-526CFE.svg" alt="MkDocs Material" /></a>
  <a href="./docs/security/lgpd-compliance.md"><img src="https://img.shields.io/badge/LGPD-Art.%2011-blue.svg" alt="LGPD" /></a>
  <a href="./SECURITY.md"><img src="https://img.shields.io/badge/Seguran%C3%A7a-pol%C3%ADtica-red.svg" alt="Política de segurança" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/Licen%C3%A7a-MIT-blue.svg" alt="Licença MIT" /></a>
</p>

<p align="center">
  <strong><a href="https://purelifeministriesbrasil.github.io/documentation/">Abrir a documentação →</a></strong>
</p>

---

## Sumário

1. [O ecossistema](#1-o-ecossistema)
2. [O que está documentado](#2-o-que-está-documentado)
3. [Estrutura do repositório](#3-estrutura-do-repositório)
4. [Como executar localmente](#4-como-executar-localmente)
5. [Publicação](#5-publicação)
6. [Governança](#6-governança)

---

## 1. O ecossistema

Regra de ouro: **“Front com Front, Back com Back e Docs com Docs.”**

| Repositório | Responsabilidade | Stack | Hospedagem |
|---|---|---|---|
| [`frontend`](https://github.com/purelifeministriesbrasil/frontend) | Site institucional e formulários | Astro 5 (estático), Tailwind v4, ilhas Preact | Cloudflare Pages |
| [`backend`](https://github.com/purelifeministriesbrasil/backend) | API: formulários, PIX, criptografia, expurgo LGPD | Cloudflare Worker (Hono), Drizzle, Neon via Hyperdrive | Cloudflare Workers |
| [`documentation`](https://github.com/purelifeministriesbrasil/documentation) | Arquitetura, requisitos, ADRs, runbooks e governança | MkDocs Material, Mermaid | GitHub Pages |

---

## 2. O que está documentado

| Seção | Conteúdo |
|---|---|
| **Primeiros passos** | Início rápido, variáveis de ambiente, configuração do banco (Neon) |
| **Arquitetura** | Visão do sistema, escopo dos repositórios, diagramas de sequência, modelo de dados |
| **Requisitos** | Requisitos funcionais (RF), não funcionais (RNF) e regras de negócio (RN) |
| **Decisões (ADRs)** | ADR-001 a ADR-009 — do Astro ao Neon + Hyperdrive |
| **Contratos de dados** | Triagem, contato, newsletter e doação (gerados do código real) |
| **Segurança** | Modelo de ameaças, arquitetura criptográfica, LGPD |
| **Operações** | Implantação, gestão de conteúdo, migração do site antigo, backup, rotação de chaves, observabilidade, comandos |
| **Design e glossário** | Design system e linguagem ubíqua do domínio |

---

## 3. Estrutura do repositório

```
documentation/
├── docs/
│   ├── index.md            # Página inicial do portal
│   ├── getting-started/    # Início rápido, ambiente, banco
│   ├── architecture/       # Visão geral, repositórios, sequências, modelo de dados
│   ├── requirements/       # RF, RNF e regras de negócio
│   ├── adrs/               # Registros de decisão (ADR-001 a ADR-009)
│   ├── schemas/            # Contratos de dados
│   ├── security/           # Ameaças, criptografia, LGPD
│   ├── operations/         # Runbooks
│   ├── design-system/      # Cores, tipografia e componentes
│   ├── glossary/           # Glossário
│   ├── governance/         # Conduta, contribuição, segurança e licença
│   └── assets/             # Logos, CSS e scripts do tema
├── mkdocs.yml              # Tema, extensões e navegação (toda página nova entra em `nav`)
├── requirements.txt        # Dependências Python
└── .github/                # Publicação no GitHub Pages, modelos de issue e de pull request
```

Cada pasta de `docs/` é uma seção do site; a ordem e os títulos vêm do `nav` do `mkdocs.yml`.

---

## 4. Como executar localmente

Pré-requisito: **Python 3.11+**.

```bash
# com uv (recomendado)
uv run --with-requirements requirements.txt mkdocs serve          # http://127.0.0.1:8000
uv run --with-requirements requirements.txt mkdocs build --strict # mesma validação do CI

# ou com venv
python -m venv .venv
.venv\Scripts\Activate.ps1        # Windows (PowerShell)
source .venv/bin/activate         # Linux / macOS
pip install -r requirements.txt
mkdocs serve
```

---

## 5. Publicação

Todo push no `main` compila com `mkdocs build --strict` e publica no GitHub Pages
([`deploy-pages.yml`](.github/workflows/deploy-pages.yml)). Qualquer aviso ou link quebrado interrompe a
publicação.

---

## 6. Governança

[Contribuição](CONTRIBUTING.md) · [Segurança](SECURITY.md) · [Código de Conduta](CODE_OF_CONDUCT.md) ·
[Licença MIT](LICENSE)
