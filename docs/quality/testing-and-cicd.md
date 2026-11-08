# Testes e CI/CD

O que cada repositório testa, o que cada pipeline executa e o que **não** é validado automaticamente. Baseline: backend `ca9737f`, frontend `4a08dfc`, documentation `beb4a18`.

---

## 1. Suítes de teste

| Repositório | Ferramenta | O que existe | O que não existe |
|---|---|---|---|
| `backend` | Vitest (21 arquivos em `tests/`, 182 casos com banco descartável; os que exigem banco são pulados sem `TEST_DATABASE_URL`) | Casos de uso ponta a ponta com portas simuladas, cripto, scrubber, guardas de requisição, rotas Hono, configuração fail-closed, máquina de estados, webhooks e lease, expurgo, canário de PII e integração com Postgres real | Teste do ramo SQL da CLI `pastoral-inbox.mjs` (só as regras puras são testadas); teste de re-cifragem; teste de gateways contra sandbox real |
| `frontend` | Verificações estruturais (sem framework de testes) | `astro check` + `tsc`, build, topologia (18 páginas estáticas, `_headers` com CSP), ausência de estilo inline | **Sem testes unitários** nem de componentes; sem teste de acessibilidade ou de desempenho |
| `documentation` | `mkdocs build --strict` (local e em PR) | Links, nav e avisos do MkDocs | Verificação de Mermaid; verificação automática contra o código |

Mapa dos arquivos do backend: [`tests/README.md`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/tests/README.md). Regra do projeto: fluxo novo que manipula dado sensível precisa de um caso em [`canary.test.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/tests/canary.test.ts).

## 2. Pipelines (GitHub Actions)

| Repositório | Workflow | Gatilhos | Jobs / etapas |
|---|---|---|---|
| `backend` | [`ci.yml`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/.github/workflows/ci.yml) | `push` e `pull_request` em `main` | Postgres 17 como serviço; pnpm 12, Node 22; `pnpm lint` (ESLint + fronteiras); `pnpm typecheck`; cria roles `anon`/`authenticated`; `pnpm db:migrate`; prova que `anon` não lê `triage_submissions`; `pnpm test` (com `TEST_DATABASE_URL`); `wrangler deploy --dry-run` (bundle). **Não publica o Worker** |
| `frontend` | [`ci.yml`](https://github.com/purelifeministriesbrasil/frontend/blob/4a08dfc03ef6f5cc6adf907da5bfa454960a9add/.github/workflows/ci.yml) | `push` e `pull_request` em `main` | Job `verify`: pnpm 12, Node 22, `pnpm ci:verify`. Job `deploy` (só `push` em `main`, ambiente `production`): rebuild com a site key real e `wrangler@3.114.0 pages deploy` no projeto `purelife-site` |
| `documentation` | [`deploy-pages.yml`](https://github.com/purelifeministriesbrasil/documentation/blob/beb4a18febc32092b352f96eea984d9ace52a3ae/.github/workflows/deploy-pages.yml) | `push` em `main` e `workflow_dispatch` | Python 3.12, `pip install -r requirements.txt`, `mkdocs build --strict`, publica no GitHub Pages |

O deploy do Worker é **manual** (`pnpm run deploy`), conforme o [runbook](../operations/deployment.md).

Workflows adicionados nos PRs de R7 e R8 (2026-11-07):

| Repositório | Workflow | Gatilhos | O que faz |
|---|---|---|---|
| `documentation` | `validate-docs.yml` | `pull_request` para `main` e manual | `pip install -r requirements.txt` e `mkdocs build --strict` em diretório temporário; não publica nada |
| `backend`, `frontend` | `schema-sync.yml` | `pull_request` (só avisa), `push` em `main`, semanal e manual (falha) | Compara `src/schemas/` com o do repositório irmão; em PR só emite aviso, porque a outra metade da mudança ainda não está na `main` |
| `backend`, `frontend` | `ci.yml` | (já existente) | Passo `verify-package-manager` garante que o pnpm em uso é o de `packageManager` (12.18.0) e que a action não declara `version:` |

### Validação da documentação em PR

Resolvida em R8: antes, um link quebrado só falhava depois do merge. O workflow `validate-docs.yml` roda `mkdocs build --strict` em todo PR para `main`. Ainda não há validação dos diagramas Mermaid.

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
| pnpm | **12.18.0** (campo `packageManager`; `pnpm/action-setup` sem `version:`) | 10.28.0 (primeira rodada) **e 12.18.0** (reprodução com a versão da CI) |
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
| Backend `wrangler deploy --dry-run` (bundle) | PASS | **Não repetido** com pnpm 12 (repetido depois, com pnpm 12.18 e Wrangler 4: PASS) |
| `pnpm deploy` sem `run` | Falha (`ERR_PNPM_NOTHING_TO_DEPLOY`), comando nativo | Também é comando **nativo** (`pnpm help deploy`: "Deploy a package from a workspace"); use `pnpm run deploy` |

Limitações da reprodução: o PostgreSQL 17.5 veio de um binário embutido (`embedded-postgres`) e não da imagem `postgres:17` do GitHub Actions (o Docker não estava disponível); `pnpm 12.18.0` é a versão mais recente do major 12 no registro, e o workflow pede apenas `12`.

## 5. O que nenhum pipeline verifica

- Estado real de produção (Cloudflare, Neon, Resend, DNS, gateways).
- Existência do segredo `CLOUDFLARE_API_TOKEN`, da variável `PUBLIC_TURNSTILE_SITE_KEY` e do ambiente `production` no GitHub.
- Core Web Vitals, acessibilidade e as medidas de tamanho do ADR-009 (R9).
- Wrangler: o backend foi atualizado para o Wrangler 4 (`^4.158.0`, PR #14) e validado com `wrangler deploy --dry-run`, sem deploy real; o primeiro deploy manual deve ser conferido. O deploy do frontend na CI ainda usa `wrangler@3.114.0 pages deploy`, fora do escopo desta mudança.

Riscos relacionados: [R1–R9](../security/threat-model.md#5-riscos-e-pendencias-conhecidos).

---

## 6. Acessibilidade e desempenho: medição local (07-08/11/2026)

Método, repetível: `pnpm build` no frontend; servir `dist/` com um servidor estático (`python3 -m http.server`); abrir cada página no Chromium (Playwright) em 1280 px e 375 px; rodar `axe-core` com as regras WCAG 2.0/2.1 A e AA e *best-practices*; rodar Lighthouse (mobile e desktop) em sete páginas.

| Medida | Resultado | Limite |
|---|---|---|
| axe-core, 16 páginas × 2 larguras | 4 regras violadas antes; **0 violações** depois das correções (frontend #13) | Teste automático cobre só parte do WCAG; não substitui leitor de tela e navegação por teclado feitos por pessoas |
| Lighthouse local | Acessibilidade 100 e SEO 100 nas 7 páginas; desempenho 96 a 100; melhor prática 96 a 100 | Sem CDN, sem os cabeçalhos do Cloudflare e sem rede real: **não é medição do site publicado** |

**Pendente (R6):** repetir Lighthouse (PageSpeed Insights) e axe contra o domínio publicado, e testar leitor de tela (NVDA ou VoiceOver) nos formulários de contato, triagem e newsletter.

