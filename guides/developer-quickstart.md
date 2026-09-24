# Guia de Onboarding e Quickstart do Desenvolvedor

**Documento de Engenharia de Software e Procedimento Operacional Padrão (POP)**  
**Classificação:** Guia Interno de Engenharia  
**Público-Alvo:** Desenvolvedores Fullstack, Engenheiros de Software e Especialistas em AppSec

---

## 1. Visão Geral do Ambiente Multirepo

O ecossistema **Pure Life Ministries Brasil** é estruturado em uma topologia multirepo rigorosa. Cada subsistema reside em um diretório independente na raiz do workspace, possuindo responsabilidades e ciclos de vida bem delimitados:

```text
purelifeministriesbrasil/
├── contracts/       # [purelife-contracts] Biblioteca de tipos TypeScript e esquemas Zod (.strict())
├── frontend/        # [purelife-web] Astro v5 SSG, Tailwind v4, React 19 Islands pontuais
├── backend/         # [purelife-api] Cloudflare Worker (Clean Architecture/DDD, Neon Postgres)
├── cms/             # [purelife-cms] Sanity Studio v3 para conteúdo editorial público
├── documentation/   # [purelife-docs] Documentação canónica com Docsify via GitHub Pages
└── infra/           # [purelife-infra] Módulos Terraform para governança de borda Cloudflare
```

---

## 2. Pré-Requisitos de Ambiente

Certifique-se de possuir instaladas as seguintes ferramentas na sua estação de trabalho:

- **Node.js:** Versão 22 LTS ou superior.
- **Gerenciador de Pacotes:** `pnpm` (versão 9 ou superior) ou `npm` (v10+).
- **Cloudflare Wrangler CLI:** `npm install -g wrangler` (para desenvolvimento do Worker).
- **Git:** Versão 2.40 ou superior com suporte a Conventional Commits.

---

## 3. Inicialização Rápida em 5 Minutos

<!-- tabs:start -->

#### **1. Instalação de Dependências**

Execute a instalação das dependências a partir de cada diretório. O repositório `contracts` deve ser compilado primeiro, pois `frontend` e `backend` dependem de suas definições:

```bash
# 1. Compilar contratos compartilhados
cd contracts
npm install
npm run build
npm test

# 2. Instalar dependências da API Backend
cd ../backend
npm install
npm test

# 3. Instalar dependências do Frontend Astro
cd ../frontend
npm install

# 4. Instalar dependências do CMS
cd ../cms
npm install
```

#### **2. Configuração de Variáveis de Ambiente**

Copie os modelos de exemplo para as instâncias locais. Nunca versione arquivos `.env` reais:

```bash
# No diretório backend/
cp .env.example .env

# No diretório frontend/
cp .env.example .env
```

Configurações recomendadas para execução local do `backend/.env`:

```ini
# Configurações do Worker em Ambiente Local
ENVIRONMENT=development
PORT=8787

# Banco de Dados Neon (Branch de Desenvolvimento)
DATABASE_URL=postgresql://user:password@ep-dev-sample.us-east-2.aws.neon.tech/neondb?sslmode=require

# Chaves de Criptografia AES-256-GCM (32 bytes em Base64 para teste local)
TRIAGE_ENCRYPTION_KEY_V1=dGVzdF9rZXlfZm9yX2xvY2FsX2RldmVsb3BtZW50XzMyYg==
CURRENT_KEY_VERSION=1

# Tokens de Gateways (Modo Sandbox)
ASAAS_API_KEY=$aact_local_sandbox_mock_token
ASAAS_WEBHOOK_SECRET=local_webhook_secret_hmac_test
CLOUDFLARE_TURNSTILE_SECRET=1x0000000000000000000000000000000AA
```

#### **3. Execução dos Servidores Locais**

Abra terminais dedicados para cada subsistema:

```bash
# Terminal 1: Backend API (porta 8787)
cd backend
npm run dev

# Terminal 2: Frontend Astro SSG (porta 4321)
cd frontend
npm run dev

# Terminal 3: Documentação Docsify (porta 3000)
cd documentation
npx serve . -p 3000
```

<!-- tabs:end -->

---

## 4. Matriz de Comandos de Validação e Testes

A qualidade do código é assegurada por testes automatizados em múltiplas camadas antes de cada commit:

| Repositório | Comando de Teste | Escopo da Validação |
|---|---|---|
| `contracts` | `npm test` | 24 testes unitários cobrindo esquemas Zod `.strict()`, sanitização de CPF, telefone E.164 e invariantes de idade. |
| `backend` | `npm test` | 33 testes de arquitetura limpa, cifra AES-256-GCM com AAD, idempotência transacional, expurgo LGPD e máquina de estados. |
| `frontend` | `npm run verify:topology` | Validação estática de 15 páginas geradas como HTML puro em `/dist`. |
| `frontend` | `npm run verify:no-inline-style` | Auditoria estática garantindo zero atributos `style=` inline e zero fontes depreciadas. |

---

## 5. Fluxo de Trabalho e Padrão de Commits

O projeto segue rigorosamente o padrão **Conventional Commits**:

```text
<tipo>(<escopo>): <descrição no imperativo e minúsculas>

[corpo opcional detalhando a motivação técnica e trade-offs]
```

### Tipos Permitidos
- `feat`: Nova funcionalidade para o usuário ou cliente da API.
- `fix`: Correção de defeito ou falha de validação.
- `docs`: Modificações em arquivos de documentação e diagramas.
- `refactor`: Refatoração sem alteração de comportamento observável.
- `test`: Inclusão ou ajuste de testes automatizados.
- `ci`: Alterações em workflows do GitHub Actions ou configurações de deploy.
- `chore`: Atualização de dependências ou rotinas administrativas.

### Checklist Obrigatório Pré-Commit
- [ ] Testes do `contracts` executados e passando (`24/24 PASS`).
- [ ] Testes do `backend` executados e passando (`33/33 PASS`).
- [ ] Verificações estáticas do `frontend` executadas e aprovadas.
- [ ] Nenhum emoji inserido em código, commits ou documentação (usar tags `[TAG]`).
- [ ] Nenhum segredo ou chave privada inserida em arquivos versionados.
