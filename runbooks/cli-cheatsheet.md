# Cheat Sheet Operacional e Linha de Comando (CLI)

**Referência Rápida de Comandos para Desenvolvimento e Operações**  
**Versão:** 1.0.0  
**Classificação:** Guia Operacional Prático  
**Ferramentas:** Vitest, Cloudflare Wrangler, Drizzle ORM, Astro CLI e Terraform

---

## 1. Testes Automatizados e Qualidade

<!-- tabs:start -->

#### **Contracts**

```bash
cd contracts

# Executar suite completa de 24 testes Zod
npm test

# Executar testes em modo observador (watch)
npx vitest

# Gerar relatório de cobertura de código
npx vitest run --coverage
```

#### **Backend (purelife-api)**

```bash
cd backend

# Executar suite completa de 33 testes de arquitetura e criptografia
npm test

# Executar apenas testes de criptografia AES-GCM
npx vitest run tests/crypto.test.ts

# Executar apenas testes de idempotência e webhooks
npx vitest run tests/webhook.test.ts

# Executar testes da máquina de estados pastoral
npx vitest run tests/state-machine.test.ts
```

#### **Frontend (purelife-web)**

```bash
cd frontend

# Compilar aplicação para produção SSG
npm run build

# Executar verificação de topologia estática (15 páginas HTML puro)
npm run verify:topology

# Executar auditoria de ausência de atributos style= inline
npm run verify:no-inline-style

# Pipeline local completo pré-deploy
npm run ci:verify
```

<!-- tabs:end -->

---

## 2. Operações com Cloudflare Wrangler (Worker & Borda)

<!-- tabs:start -->

#### **Desenvolvimento Local**

```bash
cd backend

# Iniciar servidor local na porta 8787 conectando com banco remoto
npx wrangler dev

# Iniciar servidor local em modo offline simulado
npx wrangler dev --local
```

#### **Gestão de Segredos Criptográficos**

```bash
cd backend

# Inserir ou atualizar chave AES-256-GCM para a versão atual
npx wrangler secret put TRIAGE_ENCRYPTION_KEY_V1

# Configurar chave do gateway de pagamentos
npx wrangler secret put ASAAS_API_KEY

# Configurar segredo de validação do Turnstile
npx wrangler secret put CLOUDFLARE_TURNSTILE_SECRET

# Listar segredos cadastrados no Worker (sem exibir valores)
npx wrangler secret list
```

#### **Deploy do Worker**

```bash
cd backend

# Deploy para o ambiente de staging
npx wrangler deploy --env staging

# Deploy para o ambiente de produção
npx wrangler deploy --env production

# Inspecionar logs em tempo real (Tail logs)
npx wrangler tail --env production
```

<!-- tabs:end -->

---

## 3. Gestão de Banco de Dados Neon e Drizzle ORM

<!-- tabs:start -->

#### **Migrações e Schema**

```bash
cd backend

# Gerar novo arquivo de migração SQL após alterar schema.ts
npx drizzle-kit generate

# Aplicar migrações pendentes no banco Neon
npx drizzle-kit migrate

# Abrir Drizzle Studio para exploração visual do banco local/dev
npx drizzle-kit studio
```

#### **Inspeção de Lock e Advisory Locks**

```sql
-- Consultar transações retendo locks de idempotência
SELECT pid, locktype, mode, granted, query 
FROM pg_locks l 
JOIN pg_stat_activity a ON l.pid = a.pid 
WHERE locktype = 'advisory';
```

<!-- tabs:end -->

---

## 4. Auditoria de Segurança e Higienização de Repositório

```bash
# Verificar se há segredos acidentalmente expostos no histórico Git
npx gitleaks detect --verbose

# Auditar vulnerabilidades em pacotes npm
npm audit --audit-level=high

# Inspecionar arquivos modificados antes do commit
git status -s
```
