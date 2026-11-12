# Proteção de Branches e Checks Obrigatórios

!!! warning "Situação em 2026-11-12"
    A branch `main` **não tem proteção** nos três repositórios (a API do GitHub responde
    `Branch not protected`). Um merge em `main` do `frontend` publica o site e um merge em `documentation`
    publica esta documentação, sem revisão obrigatória. Aplicar a proteção é decisão do responsável pelos
    repositórios; os comandos abaixo foram preparados, **não executados**.

## Checks reais de cada repositório

| Repositório | Workflow | Check (nome exato) | Obrigatório |
|---|---|---|---|
| `backend` | `ci.yml` | `Lint, Boundaries, Typecheck, Tests and DB integration` | Sim |
| `backend` | `schema-sync.yml` | `src/schemas idêntico ao do frontend` | Não (só avisa em PR) |
| `frontend` | `ci.yml` | `Typecheck, Static Build, CSP and Topology` | Sim |
| `frontend` | `ci.yml` | `Deploy to Cloudflare Pages (production)` | Não (roda só após push em `main`) |
| `frontend` | `schema-sync.yml` | `src/schemas idêntico ao do backend` | Não (só avisa em PR) |
| `documentation` | `validate-docs.yml` | `mkdocs build --strict` | Sim |

Com a trava da Política de Privacidade em `ci:verify` (frontend#14), o check obrigatório do frontend falha
enquanto houver `[PREENCHER` — comportamento desejado.

## Comandos preparados

Exigem permissão de administrador. Revise antes de executar; cada repositório é uma operação separada.

```bash
gh api -X PUT repos/purelifeministriesbrasil/backend/branches/main/protection --input - <<'JSON'
{"required_status_checks":{"strict":true,"contexts":["Lint, Boundaries, Typecheck, Tests and DB integration"]},
 "enforce_admins":false,"required_pull_request_reviews":{"required_approving_review_count":1},
 "restrictions":null,"allow_force_pushes":false,"allow_deletions":false}
JSON
```

```bash
gh api -X PUT repos/purelifeministriesbrasil/frontend/branches/main/protection --input - <<'JSON'
{"required_status_checks":{"strict":true,"contexts":["Typecheck, Static Build, CSP and Topology"]},
 "enforce_admins":false,"required_pull_request_reviews":{"required_approving_review_count":1},
 "restrictions":null,"allow_force_pushes":false,"allow_deletions":false}
JSON
```

```bash
gh api -X PUT repos/purelifeministriesbrasil/documentation/branches/main/protection --input - <<'JSON'
{"required_status_checks":{"strict":true,"contexts":["mkdocs build --strict"]},
 "enforce_admins":false,"required_pull_request_reviews":{"required_approving_review_count":1},
 "restrictions":null,"allow_force_pushes":false,"allow_deletions":false}
JSON
```

`required_approving_review_count: 1` pressupõe ao menos duas pessoas com acesso de escrita; com uma só
pessoa, use `0` e mantenha os checks obrigatórios. Conferência após aplicar:

```bash
gh api repos/purelifeministriesbrasil/backend/branches/main/protection --jq '.required_status_checks.contexts'
```
