# Cheat Sheet Operacional (CLI)

Referência dos comandos de terminal dos três repositórios, conferida com os `package.json` e scripts da baseline auditada (backend `ca9737f`, frontend `4a08dfc`).

!!! warning "`pnpm deploy` não é o script do projeto"
    `deploy` é um comando **nativo do pnpm** (publica um pacote do workspace) e falha com `ERR_PNPM_NOTHING_TO_DEPLOY` no backend (reproduzido com pnpm 10.28). Para publicar o Worker use **`pnpm run deploy`**, que executa `wrangler deploy`. Não foi reproduzido com pnpm 12 (ver [Testes e CI/CD](../quality/testing-and-cicd.md)).

---

## 1. Repositório `frontend` (Astro + Preact)

| Comando | Finalidade | Observações |
|---|---|---|
| `pnpm install --frozen-lockfile` | Instala dependências | Node 22, pnpm 12 na CI |
| `pnpm dev` | Servidor local (`http://localhost:4321`) | |
| `pnpm build` | `astro build` + `scripts/generate-csp.mjs` | Gera `dist/_headers` com CSP por hash |
| `pnpm preview` | Serve o `dist/` | |
| `pnpm typecheck` | `astro check && tsc --noEmit` | |
| `pnpm verify:topology` | [`verify-topology.mjs`](https://github.com/purelifeministriesbrasil/frontend/blob/4a08dfc03ef6f5cc6adf907da5bfa454960a9add/scripts/verify-topology.mjs) | Exige `dist/` já construído |
| `pnpm verify:no-inline-style` | [`verify-no-inline-style.mjs`](https://github.com/purelifeministriesbrasil/frontend/blob/4a08dfc03ef6f5cc6adf907da5bfa454960a9add/scripts/verify-no-inline-style.mjs) | Falha com atributos `style` ou handlers inline |
| `pnpm ci:verify` | typecheck + build + topologia + estilo inline | Mesmo comando do CI; **não há testes unitários** no frontend |

Variáveis de build: ver [Variáveis de Ambiente](../getting-started/environment.md).

## 2. Repositório `backend` (Cloudflare Worker)

| Comando | Finalidade | Pré-requisito / risco |
|---|---|---|
| `pnpm dev` | `wrangler dev` (`http://localhost:8787`) | `.dev.vars` local |
| `pnpm lint` | ESLint em `src` + [`verify-boundaries.mjs`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/scripts/verify-boundaries.mjs) | |
| `pnpm verify:boundaries` | Só as regras de dependência entre camadas | Ver [Camadas do Backend](../architecture/backend-layers.md) |
| `pnpm typecheck` / `pnpm build` | `tsc --noEmit` (ambos fazem o mesmo) | |
| `pnpm test` | Vitest; testes com banco são pulados sem `TEST_DATABASE_URL` | |
| `pnpm verify` | lint + typecheck + test | |
| `pnpm db:migrate:dry-run` | Lista migrations pendentes | Lê `DATABASE_URL` |
| `pnpm db:migrate` | Aplica migrations (forward-only, com checksum) | **Altera o banco apontado por `DATABASE_URL`.** Nunca use contra produção sem o runbook de [Deploy](deployment.md) |
| `pnpm run deploy` | `wrangler deploy` | Publica o Worker na conta autenticada |
| `pnpm exec wrangler secret put <NOME>` | Define segredo do Worker | Valor vem do cofre; nunca em chat |
| `pnpm exec wrangler tail purelife-api --format pretty` | Logs ao vivo | Logs já passam pelo scrubber |
| `pnpm exec wrangler rollback <id>` | Reverte o Worker | |

Exemplos com variáveis do arquivo `.env` (nunca versionado):

```bash
node --env-file=.env scripts/migrate.mjs --dry-run
node --env-file=.env scripts/migrate.mjs
```

### Caixa pastoral

[`scripts/pastoral-inbox.mjs`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/scripts/pastoral-inbox.mjs) decifra **localmente** triagens e contatos. Variáveis: `DATABASE_URL` (conexão direta), `TRIAGE_KEY_V<n>` (todas as versões em uso) e `OPERATOR` (e-mail de quem lê, gravado em `audit_events`). Execute só em máquina confiável e não redirecione a saída para arquivos compartilhados.

| Comando | O que faz | Auditoria |
|---|---|---|
| `list` | Lista triagens e contatos com status diferente de `closed`/`purged` (sem decifrar) | Grava `inbox.list` (sem motivo) |
| `show <CÓDIGO> --reason "motivo" [--include-report]` | Decifra contato (triagem) ou contato e mensagem (contato); `--include-report` também decifra o relato | `--reason` com no mínimo 5 caracteres; grava `triage.contact_read`, `triage.report_read` ou `contact.read` |
| `set-status <CÓDIGO> <status>` | Atualiza o status | Grava `*.status_changed` com o próprio status como motivo |

!!! danger "Limitação conhecida (R4)"
    `set-status` **não valida** o valor nem exige justificativa. Valores aceitos pelo banco: triagem `received`, `in_review`, `contacted`, `closed`, `purged`; contato `received`, `answered`, `closed`, `purged`. Um valor fora da lista falha no CHECK do banco, mas valores válidos para o tipo errado (por exemplo `in_review` em um contato) só são descobertos pelo erro do banco. O status `purged` é recusado pelo CHECK `*_purged_clean` enquanto o registro tiver dados. Não rode a CLI contra dados reais para testes: use banco descartável.

## 3. Site no Cloudflare Pages

O caminho padrão é o job `deploy` do `ci.yml` do frontend (push em `main`); ver [Deploy, §8](deployment.md#8-site-cloudflare-pages). Contingência manual:

```bash
cd frontend && pnpm ci:verify && cd ../backend
pnpm exec wrangler pages deploy ../frontend/dist --project-name purelife-site --branch main   # produção
pnpm exec wrangler pages deploy ../frontend/dist --project-name purelife-site --branch revisao # prévia
```

## 4. Repositório `documentation` (MkDocs Material)

```bash
uv run --with-requirements requirements.txt mkdocs serve          # http://127.0.0.1:8000
uv run --with-requirements requirements.txt mkdocs build --strict # mesma validação do CI
```

O CI da documentação só executa o build `--strict` em `push` na `main`; pull requests **não** são validados automaticamente (ver [Testes e CI/CD](../quality/testing-and-cicd.md)).
