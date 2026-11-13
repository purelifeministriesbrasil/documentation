# purelife-docs

Documentação técnica do ecossistema digital do **Pure Life Ministries Brasil**: arquitetura, requisitos, ADRs, contratos de dados, segurança, operação e governança.

[![Validate docs](https://github.com/purelifeministriesbrasil/documentation/actions/workflows/validate-docs.yml/badge.svg)](https://github.com/purelifeministriesbrasil/documentation/actions/workflows/validate-docs.yml)
[![Deploy MkDocs to GitHub Pages](https://github.com/purelifeministriesbrasil/documentation/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/purelifeministriesbrasil/documentation/actions/workflows/deploy-pages.yml)
[![Licença MIT](https://img.shields.io/badge/Licen%C3%A7a-MIT-blue.svg)](LICENSE)

> Parte do ecossistema Pure Life Ministries Brasil: [backend](https://github.com/purelifeministriesbrasil/backend) · [frontend](https://github.com/purelifeministriesbrasil/frontend) · [documentação](https://github.com/purelifeministriesbrasil/documentation)

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Início rápido](#2-início-rápido)
3. [Comandos](#3-comandos)
4. [Estrutura do repositório](#4-estrutura-do-repositório)
5. [Configuração](#5-configuração)
6. [Qualidade e CI](#6-qualidade-e-ci)
7. [Publicação e reversão](#7-publicação-e-reversão)
8. [Manutenção](#8-manutenção)
9. [Governança](#9-governança)

## 1. Visão geral

Site MkDocs Material publicado no GitHub Pages: **<https://purelifeministriesbrasil.github.io/documentation/>**.

| Repositório | Responsabilidade | Stack | Hospedagem |
|---|---|---|---|
| [`backend`](https://github.com/purelifeministriesbrasil/backend) | API: formulários, PIX, criptografia, expurgo LGPD | Cloudflare Worker (Hono), Neon | Cloudflare Workers |
| [`frontend`](https://github.com/purelifeministriesbrasil/frontend) | Site institucional e formulários | Astro (estático) | Cloudflare Pages |
| [`documentation`](https://github.com/purelifeministriesbrasil/documentation) | Este repositório | MkDocs Material, Mermaid | GitHub Pages |

### O que está documentado

| Seção | Conteúdo |
|---|---|
| Início | Página inicial do portal |
| Começar | Início rápido, ambiente, banco de dados |
| Manutenção do site | Guia do Mantenedor, gestão de conteúdo |
| Arquitetura | Visão do sistema, camadas, modelo de dados e ADRs |
| Contratos de dados | Esquemas dos formulários e integrações |
| Segurança & LGPD | Modelo de ameaças, criptografia, controles de privacidade |
| Operação | Implantação, go-live, backup, rotação de chaves, incidentes, observabilidade, banco |
| Qualidade & DevOps | Testes e CI/CD, proteção de branches, dependências |
| Requisitos | RF, RNF e regras de negócio |
| Governança | Contribuição, estilo da documentação, código de conduta, política de segurança, licença, glossário |

## 2. Início rápido

Pré-requisito: Python (a CI usa 3.12).

Com `uv` (recomendado):

```bash
uv run --with-requirements requirements.txt mkdocs serve
```

```bash
uv run --with-requirements requirements.txt mkdocs build --strict
```

Alternativa com `venv`:

```bash
python -m venv .venv
```

```bash
source .venv/bin/activate
```

No Windows (PowerShell), use `.venv\Scripts\Activate.ps1` no lugar do comando acima.

```bash
pip install -r requirements.txt
```

```bash
mkdocs serve
```

```bash
mkdocs build --strict
```

O servidor local responde em `http://127.0.0.1:8000`.

## 3. Comandos

| Comando | Efeito |
|---|---|
| `mkdocs serve` | Servidor local com recarga automática |
| `mkdocs build --strict` | Compila em `site/`; qualquer aviso (link quebrado, página fora do `nav`) falha o build. Mesma validação da CI |
| `pip install -r requirements.txt` | Instala as dependências |

## 4. Estrutura do repositório

```text
documentation/
├── docs/                   # Conteúdo do site (cada pasta é uma seção)
│   ├── index.md            # Página inicial
│   ├── adrs/               # Registros de decisão (ADR-NNN)
│   ├── governance/         # Contribuição, estilo da documentação, conduta, segurança, licença
│   └── assets/             # Imagens, CSS e scripts do tema
├── mkdocs.yml              # Tema, extensões e navegação (nav)
├── requirements.txt        # Dependências Python
├── .editorconfig           # Convenções de formatação de arquivos
└── .github/
    ├── workflows/          # validate-docs.yml, deploy-pages.yml
    ├── dependabot.yml      # Atualizações de pip e github-actions
    ├── CODEOWNERS          # Revisores obrigatórios
    ├── ISSUE_TEMPLATE/
    └── PULL_REQUEST_TEMPLATE.md
```

A ordem e os títulos das páginas vêm do `nav` do `mkdocs.yml`.

## 5. Configuração

| Item | Valor |
|---|---|
| Tema | `material`, idioma `pt-BR` |
| `site_url` | `https://purelifeministriesbrasil.github.io/documentation/` |
| `edit_uri` | `edit/main/docs/` |
| Plugins | `search` (`lang: pt`) |
| Extensões | `admonition`, `pymdownx.details`, `pymdownx.arithmatex`, `pymdownx.superfences` com Mermaid, entre outras |
| Dependências | `mkdocs>=1.6.0,<2.0`, `mkdocs-material>=9.5.0`, `pymdown-extensions>=10.7` |
| Python da CI | 3.12 (`actions/setup-python@v5`) |

## 6. Qualidade e CI

| Arquivo | Gatilho | Check | Garantia |
|---|---|---|---|
| [`validate-docs.yml`](.github/workflows/validate-docs.yml) | `pull_request` para `main`, `workflow_dispatch` | `mkdocs build --strict` | O site compila sem avisos; nada é publicado |
| [`deploy-pages.yml`](.github/workflows/deploy-pages.yml) | `push` em `main`, `workflow_dispatch` | `build-and-deploy` | Compila com `--strict` e publica no GitHub Pages |
| [`dependabot.yml`](.github/dependabot.yml) | Agendado | — | PRs de atualização para `pip` e `github-actions` |

## 7. Publicação e reversão

| Ação | Como |
|---|---|
| Publicar | Merge do PR em `main`; `deploy-pages.yml` compila e publica |
| Reverter | `git revert -m 1 <commit-de-merge>` em um PR; o merge da reversão republica a versão anterior |

Um build `--strict` com falha não publica; a versão anterior continua no ar.

## 8. Manutenção

### Adicionar uma página

1. Criar o arquivo `.md` na pasta da seção em `docs/`.
2. Adicionar a página ao `nav` do `mkdocs.yml`.
3. Seguir o [guia de estilo da documentação](docs/governance/documentation-style.md).
4. Rodar `mkdocs build --strict` antes de abrir o PR.

### ADRs

| Regra | Detalhe |
|---|---|
| Numeração | Usar o próximo número livre em `docs/adrs/` (`ADR-NNN-titulo.md`) |
| Histórico | Nunca editar o conteúdo de uma ADR aceita |
| Substituição | Criar nova ADR e marcar a antiga como substituída, com link para a nova |

## 9. Governança

| Documento | Link |
|---|---|
| Contribuição | [CONTRIBUTING.md](CONTRIBUTING.md) |
| Estilo da documentação | [docs/governance/documentation-style.md](docs/governance/documentation-style.md) |
| Código de conduta | [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) |
| Política de segurança | [SECURITY.md](SECURITY.md) |
| Revisores | [.github/CODEOWNERS](.github/CODEOWNERS) |
| Licença | [MIT](LICENSE) |
