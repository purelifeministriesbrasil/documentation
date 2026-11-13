# Proteção de Branches e Checks Obrigatórios

!!! warning "Situação em 2026-11-12"
    A branch `main` **não tem proteção** nos três repositórios (a API do GitHub responde
    `Branch not protected`). Um merge em `main` do `frontend` publica o site e um merge em `documentation`
    publica esta documentação, sem revisão obrigatória. Aplicar a proteção é decisão do responsável pelos
    repositórios; o script abaixo foi preparado e **ainda não foi executado**.

## Checks reais de cada repositório

| Repositório | Workflow | Check (nome exato) | Obrigatório |
|---|---|---|---|
| `backend` | `ci.yml` | `Lint, Boundaries, Typecheck, Tests and DB integration` | Sim |
| `backend` | `codeql.yml` | `Análise de segurança (CodeQL)` | Sim |
| `backend` | `deploy.yml` | `Verificação completa` / `Publicar Worker (…)` | Não (manual) |
| `backend` | `schema-sync.yml` | `src/schemas idêntico ao do frontend` | Não (só avisa em PR) |
| `frontend` | `ci.yml` | `Typecheck, Static Build, CSP and Topology` | Sim |
| `frontend` | `codeql.yml` | `Análise de segurança (CodeQL)` | Sim |
| `frontend` | `ci.yml` | `Deploy to Cloudflare Pages (production)` | Não (roda só após push em `main`) |
| `frontend` | `schema-sync.yml` | `src/schemas idêntico ao do backend` | Não (só avisa em PR) |
| `documentation` | `validate-docs.yml` | `mkdocs build --strict` | Sim |

Com a trava da Política de Privacidade em `ci:verify` (frontend#14), o check obrigatório do frontend falha
enquanto houver `[PREENCHER` — comportamento desejado.

## Como aplicar

A configuração completa está no script `aplicar-governanca-github.sh`, na pasta de trabalho que reúne os três
repositórios (fora deles). Exige admin da organização:

```bash
bash aplicar-governanca-github.sh
```

| Item | Configuração |
|---|---|
| `main` | PR obrigatório; checks obrigatórios da tabela acima; conversas resolvidas; sem force push; sem exclusão |
| Aprovações | 0 enquanto uma só pessoa mantém os repositórios (exigir 1 travaria os próprios PRs); suba para 1 quando houver um segundo revisor |
| Segurança | Alertas e correções automáticas do Dependabot; secret scanning com bloqueio de push |
| Higiene | Branch apagada após o merge |
| `backend` | Ambiente `production` restrito à branch protegida (usado pelo Deploy API) |

Conferência:

```bash
gh api repos/purelifeministriesbrasil/backend/branches/main/protection --jq '.required_status_checks.contexts'
```
