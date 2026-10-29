# Modelo de Dados Relacional (Neon Postgres)

Fonte de verdade: [`backend/drizzle/`](https://github.com/purelifeministriesbrasil/backend/tree/main/drizzle)
(`0001_initial.sql` + `0002_supabase_hardening_and_rls.sql`), espelhada coluna a coluna em
`backend/src/infrastructure/db/schema.ts`. Campos `*_ciphertext` / `*_cipher` são AES-256-GCM com IV próprio
(`*_iv`) e `key_version`; o AAD vincula `entidade:id:campo:versão`.

---

## 1. Diagrama Entidade-Relacionamento

```mermaid
erDiagram
    triage_submissions ||--o{ triage_consents : "consentimento"
    contact_submissions ||--o{ contact_consents : "consentimento"
    donation_intents ||--o{ payment_charges : "tentativas"
    payment_charges ||--o{ payment_webhook_events : "eventos"

    triage_submissions {
        uuid id PK
        text reference_code UK "PLM-XXXX-XXXX (NULL após expurgo)"
        text program_interest "residencial|online|esposas|indefinido"
        text contact_channel "email|telefone|whatsapp"
        text status "received|in_review|contacted|closed|purged"
        text contact_ciphertext "nome, e-mail, telefone, perfil"
        text report_ciphertext "relato opcional"
        smallint key_version
        uuid idempotency_key UK
        date created_month "métrica que sobrevive ao expurgo"
        timestamptz retention_until "created_at + 180 dias"
        timestamptz purged_at
    }
    triage_consents {
        uuid id PK
        uuid triage_submission_id FK
        text purpose
        text policy_version
        timestamptz granted_at
        text origin_route
    }
    contact_submissions {
        uuid id PK
        text reference_code UK "CTT-XXXX-XXXX"
        text subject
        text contact_ciphertext
        text message_ciphertext
        text status "received|answered|closed|purged"
        uuid idempotency_key UK
        timestamptz retention_until "created_at + 180 dias"
    }
    contact_consents {
        uuid id PK
        uuid contact_submission_id FK
        text purpose
        text policy_version
    }
    donation_intents {
        uuid id PK
        integer amount_cents "500..5000000"
        text frequency "one_time|monthly"
        text donor_email_hash "HMAC-SHA256 com pepper"
        text donor_email_cipher
        uuid idempotency_key UK
    }
    payment_charges {
        uuid id PK
        uuid donation_intent_id FK
        smallint attempt_number
        text provider "asaas|mercadopago"
        text provider_charge_id
        text status "pending|confirmed|failed|refunded|cancelled|expired"
        text pix_copy_paste
        timestamptz expires_at
        timestamptz confirmed_at
    }
    payment_webhook_events {
        uuid id PK
        text provider
        text event_id "UNIQUE(provider, event_id)"
        text process_status "received|processing|processed|ignored|failed|dead_letter"
        smallint attempts
        timestamptz processing_lease_until
        uuid charge_id FK
    }
    newsletter_subscriptions {
        uuid id PK
        text email_hash UK
        text email_cipher
        text status "pending|confirmed|unsubscribed|bounced|suppressed"
        text confirm_token_hash "SHA-256 do token"
        text policy_version
        timestamptz consented_at
    }
    audit_events {
        uuid id PK
        text actor
        text action "triage.contact_read, charge.amount_mismatch, ..."
        text reason
        text entity_type
        uuid entity_id
        jsonb metadata
    }
```

---

## 2. Regras de integridade relevantes

| Constraint | Garante |
|---|---|
| `triage_purged_clean` / `contact_purged_clean` | Registro `purged` não guarda código, ciphertext nem IV |
| `contact_cipher_present` | Contato ativo sempre tem mensagem e contato cifrados |
| `charge_provider_unq` | Uma cobrança por `(provider, provider_charge_id)` |
| `charge_attempt_unq` | Uma cobrança por tentativa de cada intenção (idempotência de criação) |
| `webhook_idempotency_unq` | Um registro por evento do provedor (lease ADR-005) |
| `*_idempotency_unq` | Uma triagem / contato / intenção por `Idempotency-Key` |
| `intent_amount_chk` | R$ 5,00 a R$ 50.000,00 |

`set_updated_at()` mantém `updated_at` em `triage_submissions` e `payment_charges`.

---

## 3. Matriz de acesso

| Ator | Acesso |
|---|---|
| Worker (`postgres` via pooler) | Leitura/escrita conforme casos de uso; dados sensíveis só chegam cifrados |
| `anon`, `authenticated` (Data API) | **Nenhum**: RLS sem políticas + `REVOKE ALL` (inclusive privilégios padrão) |
| Equipe pastoral | Caixa pastoral (`scripts/pastoral-inbox.mjs`) com motivo obrigatório e registro em `audit_events` |
| Cron diário | Expurgo de triagens e contatos com `retention_until` vencido |

---

## 4. Retenção (LGPD)

| Dado | Retenção | Mecanismo |
|---|---|---|
| Triagem (contato + relato) | 180 dias | Cron `0 3 * * *` nulifica e marca `purged`; `created_month` permanece para métricas |
| Contato institucional | 180 dias | Mesmo cron |
| Newsletter | Até descadastro | Status `unsubscribed`/`suppressed` |
| Doações | Obrigação fiscal/contábil | Valores e status; e-mail do doador cifrado |
| Auditoria | Indeterminada (sem PII) | `ip_hash` pseudonimizado quando usado |
