# Hardening do Banco de Dados

O banco é acessado **somente** pela API (Worker), conectada com o usuário dono das tabelas por meio do
Hyperdrive. Nenhuma API pública de dados fica exposta: o Neon não publica o banco por HTTP, e o modelo também
nega acesso às roles públicas que plataformas como o Supabase criam (`anon`, `authenticated`). Todo o hardening
está versionado em `backend/drizzle/0002_supabase_hardening_and_rls.sql` e é aplicado por `pnpm db:migrate`.

---

## 1. Modelo de ameaça corrigido

O schema legado (antigo `frontend/supabase/schema.sql`, removido) criava tabelas com **PII em texto claro** e
políticas `INSERT` para `anon`: qualquer pessoa com a chave pública podia gravar diretamente no banco,
contornando Turnstile, validação e criptografia. O modelo atual elimina essa superfície:

| Controle | Implementação |
|---|---|
| RLS em todas as tabelas, **sem políticas** | `ALTER TABLE … ENABLE ROW LEVEL SECURITY`: nenhuma role sem `BYPASSRLS` lê ou grava |
| Revogação explícita | `REVOKE ALL ON ALL TABLES/SEQUENCES/FUNCTIONS … FROM anon, authenticated` (se as roles existirem) |
| Objetos futuros | `ALTER DEFAULT PRIVILEGES … REVOKE ALL … FROM anon, authenticated` |
| Funções seguras | `set_updated_at()` com `SECURITY INVOKER` e `SET search_path = ''` |
| Remoção de legado | `DROP FUNCTION IF EXISTS public.rls_auto_enable()` |
| Índices de FK | `webhook_charge_idx`, `charge_intent_idx`, `contact_consent_unq` |
| Dados sensíveis | Cifrados no Worker antes de chegar ao banco ([ADR-004](../adrs/ADR-004-criptografia-aes-gcm-aad.md)); e-mails de deduplicação como HMAC |
| Expurgo | CHECKs `triage_purged_clean` e `contact_purged_clean` impedem registro expurgado com identificadores |
| Transporte | Conexões com `sslmode=require`; o Hyperdrive mantém TLS até o Neon |

O bloco de `REVOKE` é condicional à existência das roles, então a mesma migration roda no Neon, no Postgres
local e no CI.

---

## 2. Verificação contínua

- **CI do backend**: cria `anon`/`authenticated`, aplica as migrations num Postgres 17 e falha se `anon`
  conseguir ler `triage_submissions`.
- **Teste manual** (Postgres local ou CI, onde a role existe):

```sql
SET ROLE anon;
SELECT 1 FROM triage_submissions LIMIT 1;   -- ERRO: permissão negada
RESET ROLE;
```

- **Neon**: `select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r';`
  deve retornar `true` para todas as tabelas.

!!! note "Avisos de linters"
    Ferramentas como o Security Advisor do Supabase classificam “RLS ligado sem políticas” como informativo
    (`INFO`). No modelo deste projeto isso é intencional: não existe acesso direto ao banco além da API.
    “Índice não usado” também é esperado num banco novo; revise só após meses de uso em produção.

---

## 3. Recomendações adicionais

1. **2FA obrigatório** para todos os membros da conta Neon e da Cloudflare.
2. **Senha do banco**: troque sempre que tiver circulado fora do cofre. Depois, atualize o Hyperdrive
   (`wrangler hyperdrive update <id> --connection-string=…`) e o segredo `DATABASE_URL`.
3. **IP Allow** (planos pagos do Neon): restrinja conexões diretas aos IPs necessários.
4. **Backups**: confirme a janela de restauração do plano ([Backup & Recuperação](backup-recovery.md)).
5. **Nunca** crie políticas RLS permissivas nem exponha uma API de dados sobre as tabelas do ministério: toda
   escrita deve passar pela API (Turnstile, validação, cifra, idempotência).
