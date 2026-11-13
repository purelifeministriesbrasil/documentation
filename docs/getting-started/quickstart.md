# Guia do Desenvolvedor (Quickstart)

Configuração do ambiente local do ecossistema **Pure Life Ministries Brasil**.

!!! info "Versões: declaradas × validadas"
    Use **Node 22** (arquivo `.nvmrc`) e o **pnpm** exato do campo `packageManager` de cada `package.json` (hoje `pnpm@12.18.0`); a CI lê a versão desse campo e o verificador `verify-package-manager` recusa divergências; ver [Testes e CI/CD](../quality/testing-and-cicd.md#4-versoes-declaradas-na-ci-validacao-local).

---

## 1. Pré-requisitos

| Ferramenta | Versão | Para quê |
|---|---|---|
| Node.js | 22 | frontend e backend |
| pnpm | 12 (CI); 10.x funcionou localmente | gerenciador de pacotes |
| Git | 2.40+ | |
| Python | 3.11+ (a CI usa 3.12) | só para a documentação MkDocs |
| PostgreSQL | 16 ou 17 (CI: 17) | só para testes de integração do backend, em banco **descartável** |

---

## 2. Clonar os repositórios

```bash
mkdir purelifeministriesbrasil && cd purelifeministriesbrasil
git clone https://github.com/purelifeministriesbrasil/frontend.git
git clone https://github.com/purelifeministriesbrasil/backend.git
git clone https://github.com/purelifeministriesbrasil/documentation.git
```

---

## 3. Frontend

```bash
cd frontend
pnpm install --frozen-lockfile
cp .env.example .env        # PUBLIC_API_URL=http://localhost:8787
pnpm dev                    # http://localhost:4321
```

| Comando | Finalidade |
| :--- | :--- |
| `pnpm dev` | Servidor local (HMR) |
| `pnpm build` | `astro build` + geração do CSP em `dist/_headers` |
| `pnpm preview` | Serve o `dist/` |
| `pnpm typecheck` | `astro check && tsc --noEmit` |
| `pnpm ci:verify` | typecheck + build + `verify:topology` (18 páginas) + `verify:no-inline-style` |

O frontend **não tem testes unitários**; `pnpm ci:verify` é o portão de qualidade.

---

## 4. Backend

```bash
cd backend
pnpm install --frozen-lockfile
cp .dev.vars.example .dev.vars   # preencha TRIAGE_KEY_V1 e HASH_PEPPER com chaves NOVAS (openssl rand -base64 32)
pnpm dev                         # http://localhost:8787
```

Para `wrangler dev`, defina também `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` ou `DATABASE_URL` com um banco de desenvolvimento ([Variáveis](environment.md#5-desenvolvimento-local)).

### Testes

```bash
pnpm verify        # lint (ESLint + fronteiras) + typecheck + testes
pnpm test          # só os testes; os de banco real são pulados sem TEST_DATABASE_URL
```

### Testes com banco real (opcional)

Use **somente** um Postgres descartável: a suíte executa `TRUNCATE` nas tabelas.

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres pnpm db:migrate
TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres pnpm test
```

!!! danger "Nunca aponte `db:migrate` ou `TEST_DATABASE_URL` para produção"
    Migrations alteram o banco e os testes de integração apagam dados.

---

## 5. Documentação (MkDocs)

```bash
cd documentation
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
mkdocs serve                  # http://127.0.0.1:8000
mkdocs build --strict         # deve terminar sem avisos
```

---

## 6. Checklist antes de abrir um Pull Request

- [ ] Frontend: `pnpm ci:verify` passa (18 páginas estáticas).
- [ ] Backend: `pnpm verify` passa; fluxo novo com dado sensível tem caso em `tests/canary.test.ts`.
- [ ] Schemas alterados em um repositório foram copiados byte a byte para o outro (a CI não detecta deriva).
- [ ] Documentação: `mkdocs build --strict` sem avisos (a CI da documentação **não** roda em pull requests).
- [ ] Nenhum segredo (`.env`, `.dev.vars`, tokens) no commit.
- [ ] Commits convencionais (`feat:`, `fix:`, `docs:`, `chore:`).
