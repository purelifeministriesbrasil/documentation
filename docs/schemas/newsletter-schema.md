# Esquema de Validação: Inscrição na Newsletter

Valida inscrições do formulário progressivo (`NewsletterForm.astro` + `newsletter-enhance.ts`), que também funciona sem JavaScript.

!!! info "Fonte de verdade"
    Código canônico: [`backend/src/schemas/newsletter/schema.ts`](https://github.com/purelifeministriesbrasil/backend/blob/main/src/schemas/newsletter/schema.ts). O repositório `frontend` mantém cópia **byte a byte**
    em `src/schemas/`, e os dois usam exatamente **Zod 4.6.7**. Qualquer alteração deve ser feita nos dois
    repositórios no mesmo ciclo de release.

## Definição do schema Zod

```typescript
import { z } from "zod";
import { emailSchema, policyVersionSchema, turnstileTokenSchema } from "../common/schema.js";

export const newsletterSchema = z.object({
  email: emailSchema,
  website: z.string().max(0, "Campo de segurança inválido").optional(), // honeypot
  policyVersion: policyVersionSchema,
  turnstileToken: turnstileTokenSchema.optional(), // ausente no fallback sem JS
}).strict();
```

## Blocos compartilhados (`common/schema.ts`)

```typescript
import { z } from "zod";

/** Remove separadores visuais comuns ("(61) 90000-0000") antes da validação de dígitos. */
const stripPhoneSeparators = (value: string): string => value.replace(/[\s().-]/g, "");

export const phoneSchema = z
  .string()
  .trim()
  .overwrite(stripPhoneSeparators)
  .regex(/^\+?\d{10,15}$/, "Telefone deve conter de 10 a 15 dígitos com DDD");

export const emailSchema = z.string().trim().toLowerCase().email("E-mail inválido").max(160);

export const policyVersionSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Versão da política deve estar no formato YYYY-MM-DD");

export const turnstileTokenSchema = z.string().min(10).max(2048);

/** Valor do header `Idempotency-Key`: UUID v4 gerado pelo cliente por tentativa lógica de envio. */
export const idempotencyKeySchema = z.uuidv4("Idempotency-Key deve ser um UUID v4");

export const IDEMPOTENCY_KEY_HEADER = "Idempotency-Key";
```

## Contrato HTTP

`POST /api/forms/newsletter` · `application/json` **ou** `application/x-www-form-urlencoded` (fallback sem JS) · corpo ≤ 1 KiB.

- Com `Accept: application/json`: sempre `200 { "ok": true, "message": "..." }` (resposta **neutra**: não revela se o e-mail já existe nem se caiu no honeypot).
- Sem JS: `303` para `PUBLIC_SITE_ORIGIN/?inscricao=confirmar`.
- `turnstileToken` presente e inválido: `403` (JSON). Parâmetros repetidos no form: `400`.

`POST /api/forms/newsletter/confirm` com `{ "token": "<43 caracteres base64url>" }` → `200` confirmado · `410` expirado/usado · `400` inválido.

## Invariantes

1. **Double opt-in**: o e-mail recebe um link `https://purelifebrasil.org/newsletter/confirmar/#token=...`. O token fica no **fragmento** (não vai a servidores nem ao `Referer`) e a confirmação exige `POST` explícito da página — scanners de e-mail que fazem `GET` não confirmam inscrições.
2. **Sem e-mail em claro**: deduplicação por `email_hash` (HMAC-SHA256 com `HASH_PEPPER`); o endereço fica cifrado. Apenas o SHA-256 do token é armazenado (válido por 48 h).
3. **Anti e-mail bombing**: reenvio de confirmação para o mesmo endereço no máximo a cada 15 minutos; inscrições `bounced`/`suppressed` nunca recebem novo envio.
4. **Honeypot** (`website`) e, quando há JavaScript disponível no formulário, Turnstile.
5. **Prova de consentimento**: `policy_version` e `consented_at` gravados.
