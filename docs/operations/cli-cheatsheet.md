# Cheat Sheet Operacional (CLI)

Referência rápida dos comandos de terminal mais utilizados na manutenção e desenvolvimento do ecossistema.

---

## 1. Repositório `frontend` (Astro + Tailwind v4)

```bash
# Instalação de pacotes
pnpm install

# Iniciar servidor local com Hot Reload
pnpm dev

# Compilar para produção (gera pasta dist/)
pnpm build

# Testar localmente a versão compilada
pnpm preview

# Executar Quality Gate completo (Build + Topologia + Verificação CSS inline)
pnpm ci:verify

# Adicionar nova dependência de produção
pnpm add <nome-do-pacote>

# Adicionar dependência de desenvolvimento
pnpm add -D <nome-do-pacote>
```

---

## 2. Repositório `backend` (Cloudflare Worker)

```bash
# Instalação de dependências
pnpm install

# Executar suíte de testes unitários e de criptografia (Vitest)
pnpm test

# Executar linter e checagem de arquitetura limpa
pnpm lint

# Compilar TypeScript
pnpm build

# Deploy do Worker para ambiente de desenvolvimento/produção
npx wrangler deploy
```

---

## 3. Repositório `documentation` (MkDocs Material)

```bash
# Instalar dependências no ambiente virtual Python
pip install -r requirements.txt

# Iniciar servidor local de documentação com live-reload (http://127.0.0.1:8000)
mkdocs serve

# Compilar a documentação estática (gera pasta site/)
mkdocs build --strict
```
