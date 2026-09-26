# Esquema de Validação: Doações e Pagamentos PIX

Define o contrato formal para geração de intenções de doação financeira e cobranças PIX, além da estrutura de webhooks recebidos dos gateways bancários.

Localização do código-fonte: [`frontend/src/schemas/donations/schema.ts`](file:///c:/Users/pedrohpsantos/Documents/purelifeministriesbrasil/frontend/src/schemas/donations/schema.ts)

---

## 1. Esquema de Criação de PIX (`createPixSchema`)

```typescript
import { z } from "zod";

export const createPixSchema = z.object({
  // Valor em centavos (ex: R$ 50,00 = 5000 centavos)
  amountCents: z
    .number()
    .int("O valor deve ser um número inteiro em centavos.")
    .min(500, "Valor mínimo de R$ 5,00.")
    .max(5_000_000, "Valor máximo de R$ 50.000,00."),
  
  frequency: z.enum(["one_time", "monthly"]),
  donorEmail: z.string().trim().toLowerCase().email("E-mail inválido.").max(160).optional(),
  turnstileToken: z.string().min(10).max(2048),
}).strict();

export type CreatePixInput = z.infer<typeof createPixSchema>;
```

---

## 2. Esquema de Webhook Financeiro (`paymentWebhookSchema`)

```typescript
export const paymentWebhookSchema = z.object({
  provider: z.enum(["asaas", "mercadopago"]),
  eventId: z.string().min(1).max(128),
  eventType: z.enum(["payment.confirmed", "payment.failed", "payment.refunded", "unknown"]),
  providerChargeId: z.string().min(1).max(128),
  amountCents: z.number().int().nonnegative(),
  occurredAt: z.string().datetime(),
}).strict();

export type PaymentWebhookEvent = z.infer<typeof paymentWebhookSchema>;
```
