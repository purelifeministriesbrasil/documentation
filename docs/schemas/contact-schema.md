# Esquema de Validação: Formulário de Contato Institucional

Valida mensagens do formulário de contato (ilha `ContactForm`) e novamente no Worker.

!!! info "Fonte de verdade"
    Código canônico: [`backend/src/schemas/contact/schema.ts`](https://github.com/purelifeministriesbrasil/backend/blob/main/src/schemas/contact/schema.ts). O repositório `frontend` mantém cópia **byte a byte**
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

## Blocos compartilhados (`common/schema.ts`)

```typescript
import { z } from "zod/mini";

/** Remove separadores visuais comuns ("(61) 90000-0000") antes da validação de dígitos. */
const stripPhoneSeparators = (value: string): string => value.replace(/[\s().-]/g, "");

// zod/mini: mesma validação do Zod 4 com API funcional (tree-shakeable), ~4x menor no navegador.
export const phoneSchema = z.string().check(
  z.trim(),
  z.overwrite(stripPhoneSeparators),
  z.regex(/^\+?\d{10,15}$/, "Telefone deve conter de 10 a 15 dígitos com DDD")
);

/** Normaliza (trim + minúsculas) antes de validar o formato, como no encadeamento do Zod clássico. */
export const emailSchema = z.pipe(
  z.string("E-mail inválido").check(z.trim(), z.toLowerCase()),
  z.email("E-mail inválido").check(z.maxLength(160))
);

export const policyVersionSchema = z
  .string()
  .check(z.regex(/^\d{4}-\d{2}-\d{2}$/, "Versão da política deve estar no formato YYYY-MM-DD"));

export const turnstileTokenSchema = z.string().check(z.minLength(10), z.maxLength(2048));

/** Valor do header `Idempotency-Key`: UUID v4 gerado pelo cliente por tentativa lógica de envio. */
export const idempotencyKeySchema = z.uuidv4("Idempotency-Key deve ser um UUID v4");

export const IDEMPOTENCY_KEY_HEADER = "Idempotency-Key";
```

## Contrato HTTP

`POST /api/forms/contato` · JSON · **`Idempotency-Key`** obrigatório · corpo ≤ 8 KiB.

| Status | Corpo | Quando |
|---|---|---|
| `200` | `{ "ok": true, "referenceCode": "CTT-XXXX-XXXX" }` | Mensagem registrada (retentativa devolve o mesmo código) |
| demais | ver [triagem](triage-schema.md#contrato-http) | Mesma semântica de `400`/`403`/`413`/`415`/`422`/`500`/`503` |

## Invariantes

1. **Consentimento explícito** (`consent: true`) registrado em `contact_consents` com `policyVersion`, data e rota.
2. **Cifra de campo**: dados de contato e mensagem são cifrados (`contact_submission:<id>:contact|message`); apenas `subject` fica em claro para triagem operacional.
3. **Retenção de 180 dias** com expurgo diário (nulifica ciphertexts e código, CHECK `contact_purged_clean`).
4. **Notificação sem conteúdo**: a equipe recebe apenas o código; o conteúdo é lido pela caixa pastoral auditada.
