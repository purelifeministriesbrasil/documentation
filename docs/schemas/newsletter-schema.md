# Esquema de Validação: Inscrição na Newsletter

Valida inscrições do formulário progressivo (`NewsletterForm.astro` + `newsletter-enhance.ts`), que também funciona sem JavaScript.

!!! info "Fonte de verdade"
    Código canônico: [`backend/src/schemas/newsletter/schema.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/schemas/newsletter/schema.ts). O repositório `frontend` mantém cópia **byte a byte**
    em `src/schemas/`, e os dois usam exatamente **Zod 4.6.7** pela API funcional `zod/mini` (menor no navegador, mesmas regras). Qualquer alteração deve ser feita nos dois
    repositórios no mesmo ciclo de release.

## Definição do schema (`zod/mini`)

```typescript
import { z } from "zod/mini";
import { emailSchema, policyVersionSchema, turnstileTokenSchema } from "../common/schema.js";

export const newsletterSchema = z.strictObject({
  email: emailSchema,
  website: z.optional(z.string().check(z.maxLength(0, "Campo de segurança inválido"))), // honeypot
  policyVersion: policyVersionSchema,
  turnstileToken: z.optional(turnstileTokenSchema), // ausente no fallback sem JS
});
```

## Blocos compartilhados

Veja [Contratos Comuns](common-schema.md): telefone, e-mail, versão da política, token do Turnstile e `Idempotency-Key`, com exemplos validados e o contrato HTTP comum (403, 413, 415, 422, 503).

## Contrato HTTP

`POST /api/forms/newsletter` · `application/json` **ou** `application/x-www-form-urlencoded` (fallback sem JS) · corpo ≤ 1 KiB.

- Com `Accept: application/json`: sempre `200 { "ok": true, "message": "..." }` (resposta **neutra**: não revela se o e-mail já existe nem se caiu no honeypot).
- Sem JS: `303` para `PUBLIC_SITE_ORIGIN/?inscricao=confirmar`.
- `turnstileToken` presente e inválido: `403` (JSON). Parâmetros repetidos no form: `400`.

`POST /api/forms/newsletter/confirm` com `{ "token": "<43 caracteres base64url>" }` → `200` confirmado · `410` expirado/usado · `400` inválido.

## Invariantes

1. **Double opt-in**: o e-mail recebe um link `https://purelifeministriesbrasil.org/newsletter/confirmar/#token=...`. O token fica no **fragmento** (não vai a servidores nem ao `Referer`) e a confirmação exige `POST` explícito da página — scanners de e-mail que fazem `GET` não confirmam inscrições.
2. **Sem e-mail em claro**: deduplicação por `email_hash` (HMAC-SHA256 com `HASH_PEPPER`); o endereço fica cifrado. Apenas o SHA-256 do token é armazenado (válido por 48 h).
3. **Anti e-mail bombing**: reenvio de confirmação para o mesmo endereço no máximo a cada 15 minutos; inscrições `bounced`/`suppressed` nunca recebem novo envio.
4. **Honeypot** (`website`) e, quando há JavaScript disponível no formulário, Turnstile.
5. **Prova de consentimento**: `policy_version` e `consented_at` gravados.
6. **Limitação conhecida (R1)**: não existe rota de descadastro nem expurgo de `newsletter_subscriptions`; o status `unsubscribed` existe no banco, mas nenhum código o grava. Ver [Controles de Privacidade](../security/lgpd-compliance.md#3-retencao-comportamento-atual-por-tabela).
