# Configuração do Banco de Dados no Supabase

O Supabase hospeda o PostgreSQL do ecossistema. O schema é provisionado **exclusivamente** pelas migrations
versionadas em [`backend/drizzle/`](https://github.com/purelifeministriesbrasil/backend/tree/main/drizzle)
— a fonte única de verdade. Não há SQL de banco no repositório `frontend`.

---

## 1. Criar o projeto

1. Na organização Supabase do ministério: **New project**.
2. **Name** `purelife-brasil` · **Region** `South America (São Paulo) sa-east-1` · **Database password** gerada no
   cofre da organização.
3. Aguarde o provisionamento.

## 2. Obter as conexões

Em **Connect** (topo do painel):

| Uso | Tipo | Porta | Onde vai |
|---|---|---|---|
| Worker em produção | Transaction pooler | 6543 | segredo `DATABASE_URL` do Worker |
| Migrations / caixa pastoral | Session pooler ou Direct | 5432 | variável de shell do operador |

O cliente do Worker já usa `prepare: false`, obrigatório no modo *transaction*.

## 3. Aplicar as migrations

```bash
cd backend
export DATABASE_URL='postgresql://postgres.<ref>:<senha>@aws-0-sa-east-1.pooler.supabase.com:5432/postgres'
pnpm db:migrate:dry-run
pnpm db:migrate
```

O runner (`scripts/migrate.mjs`) aplica cada arquivo `drizzle/NNNN_nome.sql` em ordem, numa transação por
arquivo, registra nome e SHA-256 em `public.schema_migrations` e **recusa** migrations já aplicadas que tenham
sido editadas (crie sempre uma nova migration).

| Migration | Conteúdo |
|---|---|
| `0001_initial.sql` | Tabelas, constraints de domínio, índices |
| `0002_supabase_hardening_and_rls.sql` | RLS + REVOKE, `set_updated_at()` com `search_path` fixo, índices de FK, idempotência, expurgo de contato, consentimento da newsletter |

## 4. Verificar

- **Advisors → Security Advisor**: sem alertas.
- **SQL Editor**:

```sql
-- RLS ligado em todas as tabelas
select relname, relrowsecurity from pg_class
 where relnamespace = 'public'::regnamespace and relkind = 'r' order by 1;

-- Nenhum privilégio para as roles públicas
select grantee, count(*) from information_schema.role_table_grants
 where table_schema = 'public' and grantee in ('anon', 'authenticated') group by 1;  -- sem linhas
```

## 5. Ambiente local

Qualquer PostgreSQL 15+ serve para desenvolvimento e testes de integração (ex.: `supabase start`, ou o serviço
`postgres:17` usado no CI). Para emular o Supabase, crie as roles antes de migrar:

```sql
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
```

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres pnpm db:migrate
TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres pnpm test
```

!!! warning "Table Editor e dados cifrados"
    Contato, relato, mensagens e e-mails ficam cifrados (AES-256-GCM): o Table Editor mostra apenas ciphertext.
    A equipe pastoral lê os registros pela caixa pastoral auditada (`backend/scripts/pastoral-inbox.mjs`).
