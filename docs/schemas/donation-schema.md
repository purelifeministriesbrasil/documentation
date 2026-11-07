# Esquema de Validação: Doações e PIX Dinâmico

Valida a criação de cobranças PIX (ilha `DonationForm`) e define os contratos de resposta e de eventos de webhook.

!!! info "Fonte de verdade"
    Código canônico: [`backend/src/schemas/donations/schema.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/schemas/donations/schema.ts). O repositório `frontend` mantém cópia **byte a byte**
    em `src/schemas/`, e os dois usam exatamente **Zod 4.6.7** pela API funcional `zod/mini` (menor no navegador, mesmas regras). Qualquer alteração deve ser feita nos dois
    repositórios no mesmo ciclo de release.

## Definição do schema (`zod/mini`)

```typescript
import { z } from "zod/mini";
import { emailSchema, turnstileTokenSchema } from "../common/schema.js";

export const createPixSchema = z.strictObject({
  amountCents: z
    .int("O valor deve ser um número inteiro em centavos.")
    .check(z.gte(500, "Valor mínimo de R$ 5,00."), z.lte(5_000_000, "Valor máximo de R$ 50.000,00.")),
  frequency: z.enum(["one_time", "monthly"]),
  donorEmail: z.optional(emailSchema),
  turnstileToken: turnstileTokenSchema,
});

/** Resposta pública de `POST /api/donations/create-pix`. */
export const createPixResponseSchema = z.strictObject({
  chargeId: z.uuid(),
  provider: z.enum(["asaas", "mercadopago"]),
  pixCopyPaste: z.string().check(z.minLength(1)),
  expiresAt: z.iso.datetime({ offset: true }),
  amountCents: z.int(),
});

/** Contrato interno de evento de webhook após verificação de assinatura. */
export const paymentWebhookSchema = z.strictObject({
  provider: z.enum(["asaas", "mercadopago"]),
  eventId: z.string().check(z.minLength(1), z.maxLength(128)),
  eventType: z.enum([
    "payment.confirmed",
    "payment.failed",
    "payment.expired",
    "payment.cancelled",
    "payment.refunded",
    "unknown",
  ]),
  providerChargeId: z.string().check(z.minLength(1), z.maxLength(128)),
  amountCents: z.int().check(z.nonnegative()),
  occurredAt: z.iso.datetime({ offset: true }),
});
```

## Blocos compartilhados

Veja [Contratos Comuns](common-schema.md): telefone, e-mail, versão da política, token do Turnstile e `Idempotency-Key`, com exemplos validados e o contrato HTTP comum (403, 413, 415, 422, 503).

## Contrato HTTP

`POST /api/donations/create-pix` · JSON · **`Idempotency-Key`** obrigatório · corpo ≤ 4 KiB.

| Status | Corpo | Quando |
|---|---|---|
| `200` | `createPixResponseSchema` | Cobrança criada — ou **a mesma** cobrança, se a chave for repetida |
| `409` | `{ "error": "idempotency_conflict" }` | Mesma chave reutilizada com valor/frequência diferentes |
| `502` | `{ "error": "gateway_rejected" }` | Provedor recusou a cobrança |
| `503` | `{ "error": "gateway_unavailable" }` ou `{ "error": "service_unavailable" }` | Provedor fora do ar / configuração ausente |

O QR Code é desenhado no navegador a partir de `pixCopyPaste` (mesmo conteúdo do QR do provedor), sem trafegar imagem base64 e sem exigir `data:` amplo no CSP.

`POST /api/webhooks/payment` (provedor definido por `PAYMENT_PROVIDER`):

- **Asaas**: header `asaas-access-token` comparado em tempo constante com `ASAAS_WEBHOOK_SECRET`. Eventos: `PAYMENT_RECEIVED`/`PAYMENT_CONFIRMED` → `payment.confirmed`; `PAYMENT_OVERDUE` → `payment.expired`; `PAYMENT_DELETED` → `payment.cancelled`; `PAYMENT_REFUNDED` → `payment.refunded`.
- **Mercado Pago**: `x-signature` (`ts`, `v1`) validado por HMAC-SHA256 do manifesto `id:{data.id};request-id:{x-request-id};ts:{ts};`; em seguida o pagamento é consultado em `GET /v1/payments/{id}` (a notificação não traz status nem valor).
- Corpo limitado a **64 000 bytes** (`413`); método diferente de POST responde `405`.
- Respostas: `200` processado/ignorado/duplicado/`dead_letter` · `400` assinatura inválida ou payload malformado · `409` lease ativo · `500` falha ao processar · `503` provedor indisponível na consulta (o provedor reenvia nos dois últimos casos). Fluxo completo em [Diagramas de Sequência](../architecture/sequence-diagrams.md#3-webhook-de-pagamento).

## Invariantes

1. **Valores em centavos inteiros**: mínimo R$ 5,00, máximo R$ 50.000,00 (também `CHECK intent_amount_chk`).
2. **Idempotência dupla**: `Idempotency-Key` do cliente → `donation_intents.idempotency_key` (único) e repassada ao provedor **somente no Mercado Pago** (`X-Idempotency-Key`). A cobrança Asaas **não recebe** a chave (só `externalReference`): se o processo falhar entre criar a cobrança no Asaas e gravar `payment_charges`, uma nova tentativa pode criar outra cobrança (**R2**, ver [Modelagem de Ameaças](../security/threat-model.md#5-riscos-e-pendencias-conhecidos)).
3. **Máquina de estados** (`domains/donations/state-machine.ts`): `confirmed` só pode ir para `refunded`; eventos que regrediriam a doação (`failed`, `expired`) são ignorados e auditados (`charge.transition_rejected`).
4. **Divergência de valor**: não altera o estado; registra `charge.amount_mismatch` em `audit_events` para conciliação manual.
5. **Frequência `monthly`**: registra a intenção e emite a **primeira** cobrança; a recorrência automática ainda não é implementada (ver limitações no runbook de deploy).
