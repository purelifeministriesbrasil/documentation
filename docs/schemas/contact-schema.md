# Esquema de Validação: Formulário de Contato Institucional

Valida mensagens do formulário de contato (ilha `ContactForm`) e novamente no Worker.

!!! info "Fonte de verdade"
    Código canônico: [`backend/src/schemas/contact/schema.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/schemas/contact/schema.ts). O repositório `frontend` mantém cópia **byte a byte**
    em `src/schemas/`, e os dois usam exatamente **Zod 4.6.7** pela API funcional `zod/mini` (menor no navegador, mesmas regras). Qualquer alteração deve ser feita nos dois
    repositórios no mesmo ciclo de release.

## Definição do schema (`zod/mini`)

```typescript
import { z } from "zod/mini";
import { emailSchema, phoneSchema, policyVersionSchema, turnstileTokenSchema } from "../common/schema.js";

export const contactSubmissionSchema = z.strictObject({
  fullName: z.string().check(z.trim(), z.minLength(2, "Nome deve ter pelo menos 2 caracteres"), z.maxLength(120)),
  email: emailSchema,
  phone: z.optional(phoneSchema),
  subject: z.string().check(z.trim(), z.minLength(2, "Assunto deve ter pelo menos 2 caracteres"), z.maxLength(100)),
  message: z.string().check(z.trim(), z.minLength(10, "Mensagem deve ter pelo menos 10 caracteres"), z.maxLength(3000)),

  consent: z.literal(true, { error: "É necessário concordar com a Política de Privacidade." }),
  policyVersion: policyVersionSchema,
  turnstileToken: turnstileTokenSchema,
});
```

## Blocos compartilhados

Veja [Contratos Comuns](common-schema.md): telefone, e-mail, versão da política, token do Turnstile e `Idempotency-Key`, com exemplos validados e o contrato HTTP comum (403, 413, 415, 422, 503).

## Contrato HTTP

`POST /api/forms/contato` · JSON · **`Idempotency-Key`** obrigatório · corpo ≤ 8 KiB.

| Status | Corpo | Quando |
|---|---|---|
| `200` | `{ "ok": true, "referenceCode": "CTT-XXXX-XXXX" }` | Mensagem registrada (retentativa devolve o mesmo código) |
| demais | ver [triagem](triage-schema.md#contrato-http) | Mesma semântica de `400`/`403`/`413`/`415`/`422`/`500`/`503` |

## Invariantes

1. **Consentimento explícito** (`consent: true`) registrado em `contact_consents` com `policyVersion`, data e rota.
2. **Cifra de campo**: dados de contato e mensagem são cifrados (`contact_submission:<id>:contact|message`); apenas `subject` fica em claro para triagem operacional.
3. **Retenção de 180 dias** com expurgo diário (nulifica ciphertexts, IVs e código, CHECK `contact_purged_clean`; o `subject` permanece em claro).
4. **Notificação sem conteúdo**: a equipe recebe apenas o código; o conteúdo é lido pela caixa pastoral auditada.
