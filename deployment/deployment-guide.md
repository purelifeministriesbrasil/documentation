# Guia Operacional de Deploy: Ecossistema Pure Life Brasil

Passo a passo para deployment de todos os sistemas em seus respectivos provedores de nuvem.

## 1. Mapeamento de Provedores

1. **`purelife-web` (Frontend)**:
   - Provedor: **Cloudflare Pages**.
   - Build Command: `pnpm build`.
   - Output Directory: `dist`.
   - Variáveis: `SANITY_PROJECT_ID`, `SANITY_DATASET`.

2. **`purelife-api` (Backend)**:
   - Provedor: **Cloudflare Workers**.
   - Comando de Deploy: `wrangler deploy`.
   - Secrets no Worker: `DATABASE_URL`, `TRIAGE_KEY_V1`, `ASAAS_API_KEY`, `ASAAS_WEBHOOK_SECRET`, `RESEND_API_KEY`.

3. **`purelife-cms` (Sanity Studio)**:
   - Provedor: **Sanity Cloud / Studio Hosting**.
   - Comando: `pnpm build` ou `sanity deploy`.

4. **`purelife-infra` (Regras de Borda)**:
   - Provedor: **Cloudflare Edge (via Terraform)**.
   - Comandos: `terraform init && terraform plan && terraform apply`.

5. **`purelife-docs` (Documentação)**:
   - Provedor: **GitHub Pages**.
   - Deploy automático via GitHub Actions a partir da branch `main`.

---

## 2. Sequência de Inicialização Recomendada

```bash
# 1. Contratos
cd contracts
pnpm install
pnpm build

# 2. Infraestrutura de Borda
cd ../infra
terraform init
terraform apply -var-file="terraform.tfvars"

# 3. Backend e Migrações
cd ../backend
pnpm install
pnpm build
# Executar migrations no Neon Postgres
npx drizzle-kit migrate

# 4. Frontend
cd ../frontend
pnpm install
pnpm build

# 5. CMS
cd ../cms
pnpm install
pnpm build
```
