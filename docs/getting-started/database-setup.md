# Configuração do Banco de Dados (Neon)

O PostgreSQL do ecossistema fica no **Neon**, na região **AWS São Paulo (`aws-sa-east-1`)**. A API acessa o
banco por meio do **Cloudflare Hyperdrive** (conexões mantidas abertas na borda). O schema é provisionado
**exclusivamente** pelas migrations versionadas em
[`backend/drizzle/`](https://github.com/purelifeministriesbrasil/backend/tree/main/drizzle), a fonte única de
verdade. Não há SQL de banco no repositório `frontend`.

!!! info "Por que Neon (e não Supabase)"
    No plano gratuito, o Supabase **pausa o projeto** depois de cerca de 7 dias sem atividade, e ele só volta com
    uma reativação manual. O Neon desliga o processamento após alguns minutos ocioso, mas **religa sozinho** na
    próxima conexão (cerca de meio segundo). Como o sistema usa apenas o Postgres, a troca não exigiu mudança de
    código. Decisão registrada no [ADR-008](../adrs/ADR-008-neon-hyperdrive.md).

---

## 1. Criar o projeto

1. Na conta Neon do ministério (e-mail institucional): **New project**.
2. **Region**: `AWS São Paulo (sa-east-1)`. A região não pode ser alterada depois.
3. Banco padrão `neondb`; o usuário dono (`neondb_owner`) é o usado pela API e pelas migrations.

## 2. Obter as conexões

Em **Connect** (topo do painel):

| Uso | Tipo | Host | Onde vai |
|---|---|---|---|
| Hyperdrive (produção) | Direta | `ep-….sa-east-1.aws.neon.tech` (sem `-pooler`) | `wrangler hyperdrive create` |
| Reserva do Worker | Com pooling | `ep-…-pooler.sa-east-1.aws.neon.tech` | segredo `DATABASE_URL` do Worker |
| Migrations e caixa pastoral | Direta | sem `-pooler` | `backend/.env` (fora do git) |

!!! warning "Parâmetros da URL"
    Mantenha `?sslmode=require` e **remova** `&channel_binding=require`: o driver `postgres.js` usado pela API não
    suporta esse parâmetro. O cliente já usa `prepare: false`, compatível com o pooling do Neon e com o Hyperdrive.

## 3. Aplicar as migrations

```bash
cd backend
export DATABASE_URL='postgresql://<usuario>:<senha>@ep-<endpoint>.c-2.sa-east-1.aws.neon.tech/neondb?sslmode=require'
pnpm db:migrate:dry-run
pnpm db:migrate
```

O runner (`scripts/migrate.mjs`) aplica cada arquivo `drizzle/NNNN_nome.sql` em ordem, numa transação por
arquivo, registra nome e SHA-256 em `public.schema_migrations` e **recusa** migrations já aplicadas que tenham
sido editadas (crie sempre uma nova migration).

| Migration | Conteúdo |
|---|---|
| `0001_initial.sql` | Extensão `pgcrypto`, tabelas, constraints de domínio, índices |
| `0002_supabase_hardening_and_rls.sql` | RLS + REVOKE, `set_updated_at()` com `search_path` fixo, índices de FK, idempotência, expurgo de contato, consentimento da newsletter |

O nome da `0002` é histórico: os `REVOKE` para as roles `anon` e `authenticated` só rodam se elas existirem,
então a migration funciona igual no Neon, no Postgres local e no CI.

## 4. Criar o Hyperdrive

```bash
pnpm exec wrangler hyperdrive create purelife-db --connection-string='<conexão direta>'
```

Copie o `id` para o bloco `[[hyperdrive]]` do `backend/wrangler.toml` (binding `HYPERDRIVE`). Com o binding
presente, a API usa o Hyperdrive; sem ele, cai para o segredo `DATABASE_URL`.

## 5. Verificar

No **SQL Editor** do Neon:

```sql
-- RLS ligado em todas as tabelas
select relname, relrowsecurity from pg_class
 where relnamespace = 'public'::regnamespace and relkind = 'r' order by 1;

-- Migrations aplicadas
select filename, applied_at from schema_migrations order by 1;
```

## 6. Ambiente local

Qualquer PostgreSQL 15+ serve para desenvolvimento e testes de integração (ex.: o serviço `postgres:17` usado
no CI). Para reproduzir a revogação das roles públicas, crie-as antes de migrar:

```sql
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
```

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres pnpm db:migrate
TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres pnpm test
```

Para rodar a API localmente com o binding do Hyperdrive, defina a variável de ambiente
`CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` com a conexão do banco de desenvolvimento antes do
`pnpm dev`.

!!! warning "Editor de tabelas e dados cifrados"
    Contato, relato, mensagens e e-mails ficam cifrados (AES-256-GCM): o editor de tabelas mostra apenas
    ciphertext. A equipe pastoral lê os registros pela caixa pastoral auditada (`backend/scripts/pastoral-inbox.mjs`).
