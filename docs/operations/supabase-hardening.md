# Hardening do Supabase

O banco é acessado **somente** pelo Worker, conectado com a role `postgres` (dona das tabelas). As roles da Data
API do Supabase (`anon`, `authenticated`) não têm nenhum acesso. Todo o hardening está versionado em
`backend/drizzle/0002_supabase_hardening_and_rls.sql` e é aplicado por `pnpm db:migrate`.

---

## 1. Modelo de ameaça corrigido

O schema legado (antigo `frontend/supabase/schema.sql`, removido) criava tabelas com **PII em texto claro** e
políticas `INSERT` para `anon`: qualquer pessoa com a chave pública podia gravar diretamente no banco, contornando
Turnstile, validação e criptografia. O modelo atual elimina essa superfície:

| Controle | Implementação |
|---|---|
| RLS em todas as tabelas, **sem políticas** | `ALTER TABLE … ENABLE ROW LEVEL SECURITY` — PostgREST/Realtime não leem nem escrevem nada |
| Revogação explícita | `REVOKE ALL ON ALL TABLES/SEQUENCES/FUNCTIONS … FROM anon, authenticated` |
| Objetos futuros | `ALTER DEFAULT PRIVILEGES … REVOKE ALL … FROM anon, authenticated` |
| Funções seguras | `set_updated_at()` com `SECURITY INVOKER` e `SET search_path = ''` (linter `0011`) |
| Remoção de legado | `DROP FUNCTION IF EXISTS public.rls_auto_enable()` (linter `0028`/`0029`) |
| Índices de FK | `webhook_charge_idx`, `charge_intent_idx`, `contact_consent_unq` (linter `0001`) |
| Dados sensíveis | Cifrados no Worker antes de chegar ao banco (ADR-004); e-mails de deduplicação como HMAC |
| Expurgo | CHECKs `triage_purged_clean` e `contact_purged_clean` impedem registro expurgado com identificadores |

O bloco de `REVOKE` é condicional à existência das roles, então a mesma migration roda em Postgres puro (CI/local).

---

## 2. Verificação contínua

- **CI do backend**: cria `anon`/`authenticated`, aplica as migrations num Postgres 17 e falha se `anon`
  conseguir ler `triage_submissions`.
- **Supabase → Advisors → Security Advisor**: deve permanecer sem alertas após cada migration.
- **Teste manual**:

```sql
SET ROLE anon;
SELECT 1 FROM triage_submissions LIMIT 1;   -- ERRO: permissão negada
RESET ROLE;
```

---

## 3. Recomendações adicionais no painel

1. **Data API**: se o plano permitir, desative-a (ou retire `public` dos schemas expostos).
2. **2FA obrigatório** para todos os membros da organização.
3. **Network Restrictions** (planos pagos): restrinja conexões diretas ao banco aos IPs necessários; o Worker
   usa o pooler.
4. **Backups**: confirme os backups diários; avalie PITR para o plano Pro ([Backup & Recuperação](backup-recovery.md)).
5. **Nunca** crie políticas RLS para `anon`/`authenticated` nas tabelas do ministério: toda escrita deve passar
   pela API (Turnstile, validação, cifra, idempotência).
