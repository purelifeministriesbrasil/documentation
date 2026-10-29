# Esquema de Validação: Formulário de Triagem Confidencial

Valida a solicitação de triagem pastoral no cliente (ilha `TriageForm`) e novamente no Worker antes de qualquer persistência.

!!! info "Fonte de verdade"
    Código canônico: [`backend/src/schemas/triage/schema.ts`](https://github.com/purelifeministriesbrasil/backend/blob/main/src/schemas/triage/schema.ts). O repositório `frontend` mantém cópia **byte a byte**
    em `src/schemas/`, e os dois usam exatamente **Zod 4.6.7** pela API funcional `zod/mini` (menor no navegador, mesmas regras). Qualquer alteração deve ser feita nos dois
    repositórios no mesmo ciclo de release.

## Definição do schema (`zod/mini`)

```typescript
import { z } from "zod/mini";
import { emailSchema, phoneSchema, policyVersionSchema, turnstileTokenSchema } from "../common/schema.js";

export const triageSubmissionSchema = z.strictObject({
  isAdult: z.literal(true, { error: "Este formulário é destinado a maiores de 18 anos." }),
  programInterest: z.enum(["residencial", "online", "esposas", "indefinido"]),
  profile: z.enum(["para_mim", "para_meu_conjuge", "para_um_familiar", "sou_lider"]),

  fullName: z.string().check(z.trim(), z.minLength(2, "Nome deve ter pelo menos 2 caracteres"), z.maxLength(120)),
  email: emailSchema,
  phone: z.optional(phoneSchema),
  contactChannel: z.enum(["email", "telefone", "whatsapp"]),

  /** Opcional por desenho: ninguém é obrigado a relatar nada para pedir ajuda. */
  report: z.optional(z.string().check(z.trim(), z.maxLength(2000, "Relato não pode exceder 2000 caracteres"))),

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

`POST /api/forms/triagem` · `Content-Type: application/json` · header **`Idempotency-Key: <UUID v4>`** obrigatório · corpo ≤ 8 KiB.

| Status | Corpo | Quando |
|---|---|---|
| `200` | `{ "referenceCode": "PLM-XXXX-XXXX" }` | Registrada (retentativa com a mesma chave devolve o mesmo código) |
| `400` | `{ "error": "invalid_idempotency_key" }` ou `{ "error": "invalid_json" }` | Header ausente/inválido ou JSON malformado |
| `403` | `{ "error": "turnstile_failed" }` ou vazio | Turnstile reprovado ou `Origin` não autorizada |
| `413` / `415` | vazio | Corpo grande demais / Content-Type diferente de JSON |
| `422` | `{ "error": "validation_failed", "fields": { "campo": "mensagem" } }` | Falha do schema (valores enviados nunca são ecoados) |
| `500` | `{ "error": "internal_error" }` | Falha de persistência (sem detalhes do driver) |
| `503` | `{ "error": "service_unavailable" }` | Configuração ausente/inválida no Worker (fail-closed) |

## Invariantes de negócio e segurança

1. **Maioridade estrita (`isAdult`)**: apenas `true` literal é aceito.
2. **Relato opcional por desenho (`report`)**: ninguém é obrigado a relatar algo para pedir ajuda.
3. **Modo estrito (`z.strictObject`)**: campos extras geram `422` (proteção contra poluição de propriedades).
4. **Telefone normalizado**: espaços, parênteses, pontos e hífens são removidos antes da regex (`(61) 90000-0000` → `61900000000`).
5. **Persistência cifrada**: nome, e-mail, telefone e perfil vão em `contact_ciphertext`; o relato em `report_ciphertext` (AES-256-GCM, AAD `triage_submission:<id>:<campo>:v<versão>`).
6. **Notificação sem PII**: a equipe recebe por e-mail apenas o código de referência.
7. **Retenção**: 180 dias (`retention_until`), depois expurgo automático (RN-002).
