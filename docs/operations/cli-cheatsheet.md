# Cheat Sheet Operacional (CLI)

Referência rápida dos comandos de terminal mais usados na manutenção e no desenvolvimento do ecossistema.

---

## 1. Repositório `frontend` (Astro + Preact + Tailwind v4)

```bash
pnpm install              # instala as dependências
pnpm dev                  # servidor local com recarga automática (http://localhost:4321)
pnpm build                # gera dist/ e atualiza a CSP com os hashes dos scripts
pnpm preview              # serve a versão compilada
pnpm typecheck            # astro check + tsc
pnpm ci:verify            # typecheck, build, topologia e ausência de estilos inline
```

---

## 2. Repositório `backend` (Cloudflare Worker)

```bash
pnpm install
pnpm dev                  # wrangler dev com .dev.vars (http://localhost:8787)
pnpm verify               # lint + fronteiras da arquitetura + typecheck + testes (Vitest)
pnpm test                 # só os testes

# Migrations (lê DATABASE_URL de backend/.env)
node --env-file=.env scripts/migrate.mjs --dry-run
node --env-file=.env scripts/migrate.mjs

# Caixa pastoral (decifra localmente; toda leitura exige --reason e é auditada)
node --env-file=.env scripts/pastoral-inbox.mjs list

# Deploy da API
pnpm deploy                                            # usa wrangler.toml (rota api.purelifeministriesbrasil.org)
pnpm exec wrangler deploy -c wrangler.workersdev.toml  # só antes da virada do domínio (arquivo local, fora do Git)

# Segredos e logs
pnpm exec wrangler secret put <NOME>
pnpm exec wrangler secret list
pnpm exec wrangler tail purelife-api --format pretty

# Hyperdrive
pnpm exec wrangler hyperdrive get 9194030c37b94749ba819e8428d40edf
pnpm exec wrangler hyperdrive update 9194030c37b94749ba819e8428d40edf --connection-string="<URL direta do Neon>"
```

---

## 3. Site no Cloudflare Pages (upload direto)

```bash
cd frontend && pnpm ci:verify && cd ../backend
pnpm exec wrangler pages deploy ../frontend/dist --project-name purelife-site --branch main   # produção
pnpm exec wrangler pages deploy ../frontend/dist --project-name purelife-site --branch revisao # prévia
```

---

## 4. Repositório `documentation` (MkDocs Material)

```bash
uv run --with-requirements requirements.txt mkdocs serve          # http://127.0.0.1:8000
uv run --with-requirements requirements.txt mkdocs build --strict # mesma validação do CI
```
