# Testes e CI/CD

O que cada repositório testa, o que cada pipeline executa e o que **não** é validado automaticamente. Baseline: backend `ca9737f`, frontend `4a08dfc`, documentation `beb4a18`.

---

## 1. Suítes de teste

| Repositório | Ferramenta | O que existe | O que não existe |
|---|---|---|---|
| `backend` | Vitest (17 arquivos em `tests/`, 114 casos; 6 exigem banco) | Casos de uso ponta a ponta com portas simuladas, cripto, scrubber, guardas de requisição, rotas Hono, configuração fail-closed, máquina de estados, webhooks e lease, expurgo, canário de PII e integração com Postgres real | Teste da CLI `pastoral-inbox.mjs`; teste de re-cifragem; teste de deriva de schemas entre repositórios |
| `frontend` | Verificações estruturais (sem framework de testes) | `astro check` + `tsc`, build, topologia (18 páginas estáticas, `_headers` com CSP), ausência de estilo inline | **Sem testes unitários** nem de componentes; sem teste de acessibilidade ou de desempenho |
| `documentation` | `mkdocs build --strict` | Links, nav e avisos do MkDocs | Verificação de Mermaid; verificação automática contra o código |

Mapa dos arquivos do backend: [`tests/README.md`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/tests/README.md). Regra do projeto: fluxo novo que manipula dado sensível precisa de um caso em [`canary.test.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/tests/canary.test.ts).

## 2. Pipelines (GitHub Actions)

| Repositório | Workflow | Gatilhos | Jobs / etapas |
|---|---|---|---|
| `backend` | [`ci.yml`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/.github/workflows/ci.yml) | `push` e `pull_request` em `main` | Postgres 17 como serviço; pnpm 12, Node 22; `pnpm lint` (ESLint + fronteiras); `pnpm typecheck`; cria roles `anon`/`authenticated`; `pnpm db:migrate`; prova que `anon` não lê `triage_submissions`; `pnpm test` (com `TEST_DATABASE_URL`); `wrangler deploy --dry-run` (bundle). **Não publica o Worker** |
| `frontend` | [`ci.yml`](https://github.com/purelifeministriesbrasil/frontend/blob/4a08dfc03ef6f5cc6adf907da5bfa454960a9add/.github/workflows/ci.yml) | `push` e `pull_request` em `main` | Job `verify`: pnpm 12, Node 22, `pnpm ci:verify`. Job `deploy` (só `push` em `main`, ambiente `production`): rebuild com a site key real e `wrangler@3.114.0 pages deploy` no projeto `purelife-site` |
| `documentation` | [`deploy-pages.yml`](https://github.com/purelifeministriesbrasil/documentation/blob/beb4a18febc32092b352f96eea984d9ace52a3ae/.github/workflows/deploy-pages.yml) | `push` em `main` e `workflow_dispatch` | Python 3.12, `pip install -r requirements.txt`, `mkdocs build --strict`, publica no GitHub Pages |

O deploy do Worker é **manual** (`pnpm run deploy`), conforme o [runbook](../operations/deployment.md).

### Lacuna conhecida: documentação sem validação em PR

O workflow da documentação **não roda em `pull_request`**. Um PR com link quebrado ou aviso do MkDocs só falha depois do merge, no `push` para `main`. Esta atividade **não criou nem alterou workflows**.

!!! tip "Recomendação futura (pendente de autorização)"
    Adicionar um workflow com gatilho `pull_request` que execute `pip install -r requirements.txt` e `mkdocs build --strict` (sem publicar). Opcionalmente, validar os diagramas Mermaid. Isso exige autorização, pois altera `.github/workflows` (R8).

## 3. Critérios antes de publicar

| Alteração em | Execute |
|---|---|
| `frontend` | `pnpm ci:verify` |
| `backend` | `pnpm verify`; com banco descartável, `pnpm db:migrate` + `pnpm test` com `TEST_DATABASE_URL` |
| Migrations | Nova migration, nunca editar uma aplicada; conferir `schema.ts` |
| Schemas | Copiar byte a byte para o outro repositório |
| `documentation` | `mkdocs build --strict` local, sem avisos |

## 4. Versões declaradas na CI × validação local

| Item | Declarado nos workflows | Validação local da auditoria (07/11/2026) |
|---|---|---|
| Node | 22 (`actions/setup-node`) | 22.23.4 |
| pnpm | **12** (`pnpm/action-setup`, `version: 12`) | 10.28.0 (primeira rodada) **e 12.18.0** (reprodução com a versão da CI) |
| PostgreSQL | **17** (`postgres:17`) | 16 (primeira rodada) **e 17.5** (reprodução, binário embutido descartável) |
| Python (docs) | 3.12 | 3.11+ |

### Resultados da reprodução com as versões da CI

Executada em cópias de trabalho descartáveis (`git archive` dos commits auditados), sem alterar `frontend` nem `backend`.

| Verificação | pnpm 10.28 / PG 16 | pnpm 12.18 / PG 17.5 |
|---|---|---|
| Backend `pnpm verify` | PASS (108 passaram, 6 puladas) | PASS (108 passaram, 6 puladas) |
| Backend `db:migrate` em banco vazio | PASS | PASS (2 migrations; segunda rodada idempotente) |
| Backend `anon` sem acesso a `triage_submissions` | PASS | PASS (`permission denied`) |
| Backend testes com banco real | PASS (114/114) | PASS (114/114, 17 arquivos) |
| Frontend `pnpm ci:verify` | PASS (18 páginas, 9 hashes de CSP) | PASS (18 páginas, 9 hashes de CSP) |
| Backend `wrangler deploy --dry-run` (bundle) | PASS | **Não repetido** com pnpm 12 |
| `pnpm deploy` sem `run` | Falha (`ERR_PNPM_NOTHING_TO_DEPLOY`), comando nativo | Também é comando **nativo** (`pnpm help deploy`: "Deploy a package from a workspace"); use `pnpm run deploy` |

Limitações da reprodução: o PostgreSQL 17.5 veio de um binário embutido (`embedded-postgres`) e não da imagem `postgres:17` do GitHub Actions (o Docker não estava disponível); `pnpm 12.18.0` é a versão mais recente do major 12 no registro, e o workflow pede apenas `12`.

## 5. O que nenhum pipeline verifica

- Estado real de produção (Cloudflare, Neon, Resend, DNS, gateways).
- Existência do segredo `CLOUDFLARE_API_TOKEN`, da variável `PUBLIC_TURNSTILE_SITE_KEY` e do ambiente `production` no GitHub.
- Core Web Vitals, acessibilidade e as medidas de tamanho do ADR-009 (R9).
- Deriva entre `schemas/` dos dois repositórios (R7).
- Wrangler 3: o repositório usa Wrangler 3 (`3.114.x`) com `compatibility_date` `2026-09-19`; atualizar para o Wrangler 4 é recomendado em mudança dedicada.

Riscos relacionados: [R1–R9](../security/threat-model.md#5-riscos-e-pendencias-conhecidos).
