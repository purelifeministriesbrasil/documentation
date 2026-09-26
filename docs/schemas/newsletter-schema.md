# Esquema de Validação: Inscrição em Newsletter

Valida o cadastro de e-mails para recebimento de informativos periódicos e devocionais da organização.

Localização do código-fonte: [`frontend/src/schemas/newsletter/schema.ts`](file:///c:/Users/pedrohpsantos/Documents/purelifeministriesbrasil/frontend/src/schemas/newsletter/schema.ts)

---

## 1. Definição do Esquema Zod

```typescript
import { z } from "zod";

export const newsletterSubscriptionSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(160),
  consent: z.literal(true, {
    errorMap: () => ({ message: "É necessário concordar com o recebimento de mensagens." }),
  }),
}).strict();

export type NewsletterSubscription = z.infer<typeof newsletterSubscriptionSchema>;
```

---

## 2. Invariantes de Privacidade

- O campo `email` é normalizado em letras minúsculas antes da persistência para garantir unicidade no banco de dados.
- O consentimento expresso é mandatório, respeitando as boas práticas contra e-mails não solicitados (anti-spam) e em conformidade com a LGPD.
