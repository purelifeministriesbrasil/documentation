# Diagramas de Sequência

Fluxos reais implementados em `backend/src` e `frontend/src`. O navegador **nunca** acessa o banco: toda
escrita passa pelo Worker (`https://api.purelifeministriesbrasil.org`).

---

## 1. Triagem confidencial

```mermaid
sequenceDiagram
    autonumber
    participant B as Navegador (TriageForm)
    participant T as Cloudflare Turnstile
    participant W as Worker (Hono)
    participant DB as Neon Postgres (via Hyperdrive)
    participant R as Resend

    B->>T: Renderiza widget (render explícito)
    T-->>B: token de uso único
    B->>B: Valida com triageSubmissionSchema (zod/mini)
    B->>W: POST /api/forms/triagem + Idempotency-Key (UUID v4)
    W->>W: Origin / Sec-Fetch-Site / Content-Type / tamanho
    W->>W: zod/mini strictObject (422 sem ecoar valores)
    W->>T: siteverify (timeout 3 s, fail-closed)
    W->>DB: BEGIN#59; INSERT … ON CONFLICT (idempotency_key) DO NOTHING
    alt nova submissão
        W->>W: AES-256-GCM (AAD = triage_submission:id:campo:v1)
        W->>DB: UPDATE ciphertexts#59; INSERT triage_consents#59; COMMIT
    else retentativa com a mesma chave
        W->>DB: SELECT reference_code#59; COMMIT
    end
    W-->>B: 200 { referenceCode: "PLM-XXXX-XXXX" }
    W-)R: Aviso à equipe só com o código, após a resposta (waitUntil#59; falha não desfaz a gravação)
    B->>T: reset() — novo token para um eventual reenvio
```

## 2. Doação PIX

```mermaid
sequenceDiagram
    autonumber
    participant B as Navegador (DonationForm)
    participant W as Worker
    participant DB as Postgres
    participant G as Gateway (Asaas | Mercado Pago)

    B->>W: POST /api/donations/create-pix + Idempotency-Key
    W->>DB: INSERT donation_intents ON CONFLICT (idempotency_key) DO NOTHING
    alt intenção já tem cobrança
        DB-->>W: payment_charges (pix_copy_paste)
        W-->>B: 200 mesma cobrança (sem chamar o gateway)
    else nova intenção
        W->>G: Cria cobrança PIX (X-Idempotency-Key só no Mercado Pago#59; Asaas recebe externalReference, ver R2)
        G-->>W: id + copia e cola + expiração
        W->>DB: INSERT payment_charges (attempt 1) ON CONFLICT DO NOTHING
        W-->>B: 200 { chargeId, pixCopyPaste, expiresAt, amountCents }
    end
    B->>B: Gera o QR Code localmente a partir do copia e cola
```

## 3. Webhook de pagamento

```mermaid
sequenceDiagram
    autonumber
    participant G as Gateway
    participant W as Worker
    participant DB as Postgres

    G->>W: POST /api/webhooks/payment
    alt método diferente de POST
        W-->>G: 405
    else corpo acima de 64 000 bytes
        W-->>G: 413
    end
    alt Asaas
        W->>W: asaas-access-token == ASAAS_WEBHOOK_SECRET (tempo constante)
    else Mercado Pago
        W->>W: HMAC-SHA256("id:{data.id}#59;request-id:{x-request-id}#59;ts:{ts}#59;")
        alt tópico diferente de payment
            W->>W: evento "unknown" (sem consultar o provedor)
        else tópico payment
            W->>G: GET /v1/payments/{id} (status e valor)
        end
    end
    alt assinatura inválida ou payload malformado
        W-->>G: 400 (log webhook.rejected#59; sem retry)
    else provedor indisponível na consulta
        W-->>G: 503 upstream_unavailable (o gateway reenvia)
    end
    W->>DB: INSERT … ON CONFLICT DO UPDATE (lease 60 s, máx. 5 tentativas)
    alt já processado
        W-->>G: 200 { duplicate: true }
    else lease ativo
        W-->>G: 409 (reenvio posterior)
    else tentativas esgotadas
        W-->>G: 200 (log webhook.dead_letter#59; exige ação manual)
    else reivindicado
        W->>DB: SELECT cobrança
        alt evento sem suporte (inclui "unknown")
            W->>DB: marca ignored (sem log)
            W-->>G: 200
        else valor diverge ou transição proibida (ex.: confirmed → expired)
            W->>DB: audit_events + marca ignored (log webhook.event_ignored)
            W-->>G: 200
        else transição válida
            W->>DB: UPDATE … WHERE status = estado_lido (condicional)
            W->>DB: marca processed
            W-->>G: 200
        else falha de processamento
            W->>DB: marca failed
            W-->>G: 500 (o gateway reenvia#59; a lease retoma)
        end
    end
```

Evidência: [`presentation/webhooks/payment.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/presentation/webhooks/payment.ts), [`mercadopago.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/payments/mercadopago.ts), [`process-payment-event.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/application/usecases/process-payment-event.ts); testes em `webhook.test.ts` e `gateways.test.ts`.

## 4. Newsletter (double opt-in)

```mermaid
sequenceDiagram
    autonumber
    participant B as Navegador
    participant W as Worker
    participant DB as Postgres
    participant R as Resend

    B->>W: POST /api/forms/newsletter (JSON ou form sem JS)
    W->>W: honeypot / Zod / Turnstile (se houver token)
    W->>DB: upsert por HMAC(e-mail) — cooldown de 15 min para reenvio
    W->>R: Link …/newsletter/confirmar/#token=… (token só no fragmento)
    W-->>B: Resposta neutra (200 JSON ou 303)
    B->>W: Página de confirmação: POST /api/forms/newsletter/confirm { token }
    W->>DB: UPDATE status = confirmed WHERE hash(token) e não expirado
    W-->>B: 200 confirmado / 410 expirado
```

## 5. Expurgo LGPD diário

```mermaid
sequenceDiagram
    autonumber
    participant C as Cron Trigger (0 3 * * * UTC)
    participant W as Worker (scheduled)
    participant DB as Postgres

    C->>W: scheduled()
    alt configuração de banco inválida
        W->>W: log cron.purge_skipped e encerra
    else
        W->>DB: triagens: SELECT até 500 ids WHERE retention_until < now() AND purged_at IS NULL
        loop cada triagem
            W->>DB: UPDATE status = 'purged', nulifica código, programa, canal, ciphertexts, IVs e versão
        end
        W->>DB: contatos: mesma consulta (até 500) e nulificação
        W->>W: log cron.purge_completed (somente contagens)
    end
    Note over W,DB: Uma exceção na etapa de triagens interrompe a execução antes dos contatos (log cron.purge_failed). A próxima execução diária reprocessa. Registros acima de 500 por tipo ficam para os dias seguintes.
```

Evidência: [`index.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/index.ts) (`scheduled`), [`cron/purge.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/presentation/cron/purge.ts), [`purge-repository.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/db/purge-repository.ts); teste em `purge.test.ts`. Ver R3 em [Modelagem de Ameaças](../security/threat-model.md#5-riscos-e-pendencias-conhecidos).

## 6. Leitura pastoral

```mermaid
sequenceDiagram
    autonumber
    participant P as Equipe pastoral (máquina confiável)
    participant CLI as scripts/pastoral-inbox.mjs
    participant DB as Postgres

    P->>CLI: show PLM-XXXX-XXXX --reason "motivo"
    CLI->>DB: SELECT ciphertexts
    CLI->>CLI: Decifra localmente com TRIAGE_KEY_Vn (mesmo AAD)
    CLI->>DB: INSERT audit_events (operador, ação, motivo)
    Note over CLI,DB: list também grava audit_events (sem motivo)#59; set-status não valida o status (R4)
    CLI-->>P: Dados de contato (e relato com --include-report)
```
