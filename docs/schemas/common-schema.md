# Contratos Comuns (`schemas/common`)

Blocos de validação compartilhados pelos quatro contratos ([triagem](triage-schema.md), [contato](contact-schema.md), [newsletter](newsletter-schema.md), [doação](donation-schema.md)). Antes, o mesmo trecho era repetido em cada página; agora há uma só fonte.

!!! info "Fonte de verdade e sincronização"
    Código canônico: [`backend/src/schemas/common/schema.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/schemas/common/schema.ts). O `frontend` mantém cópia **byte a byte** em `src/schemas/` (mesma versão exata do Zod, API `zod/mini`). Na baseline auditada (backend `ca9737f`, frontend `4a08dfc`) os arquivos são idênticos, mas a sincronização é **manual**: nenhum teste, script ou workflow detecta deriva (R7). Altere os dois repositórios no mesmo ciclo.

## Definição (`zod/mini`)

```typescript
import { z } from "zod/mini";

const stripPhoneSeparators = (value: string): string => value.replace(/[\s().-]/g, "");

export const phoneSchema = z.string().check(
  z.trim(),
  z.overwrite(stripPhoneSeparators),
  z.regex(/^\+?\d{10,15}$/, "Telefone deve conter de 10 a 15 dígitos com DDD")
);

export const emailSchema = z.pipe(
  z.string("E-mail inválido").check(z.trim(), z.toLowerCase()),
  z.email("E-mail inválido").check(z.maxLength(160))
);

export const policyVersionSchema = z
  .string()
  .check(z.regex(/^\d{4}-\d{2}-\d{2}$/, "Versão da política deve estar no formato YYYY-MM-DD"));

export const turnstileTokenSchema = z.string().check(z.minLength(10), z.maxLength(2048));

export const idempotencyKeySchema = z.uuidv4("Idempotency-Key deve ser um UUID v4");
export const IDEMPOTENCY_KEY_HEADER = "Idempotency-Key";
```

## Regras e exemplos

Resultados abaixo foram **executados contra o Zod real** do backend durante esta auditoria.

| Schema | Normalização | Exemplo válido | Exemplo inválido (mensagem) |
|---|---|---|---|
| `phoneSchema` | Remove espaços, parênteses, pontos e hífens | `"(61) 99999-0000"` | `"123"` → "Telefone deve conter de 10 a 15 dígitos com DDD" |
| `emailSchema` | `trim` + minúsculas; máx. 160 caracteres | `"  Ana@Example.COM "` → `ana@example.com` | `"ana@"` → "E-mail inválido" |
| `policyVersionSchema` | — | `"2026-09-19"` | `"19/09/2026"` → "Versão da política deve estar no formato YYYY-MM-DD" |
| `turnstileTokenSchema` | — | string de 10 a 2048 caracteres | `"abc"` → falha (mensagem padrão do Zod) |
| `idempotencyKeySchema` | — | `123e4567-e89b-42d3-a456-426614174000` | `"1234"` → "Idempotency-Key deve ser um UUID v4" |

### Exemplos por contrato

| Contrato | Entrada | Resultado |
|---|---|---|
| Triagem | `isAdult:true, programInterest:"residencial", profile:"para_mim", fullName:"Ana Souza", email, contactChannel:"email", consent:true, policyVersion, turnstileToken` | válida |
| Triagem | mesma entrada com o campo extra `extra: 1` | **rejeitada** (`z.strictObject`) |
| Triagem | `isAdult:false`, nome de 1 caractere, e-mail `"x"` | rejeitada: "Este formulário é destinado a maiores de 18 anos.", nome curto, e-mail inválido |
| Contato | mensagem `"Oi"` | rejeitada: "Mensagem deve ter pelo menos 10 caracteres" |
| Newsletter | sem `turnstileToken` (fallback sem JavaScript) | válida |
| Newsletter | `website: "http://spam"` (honeypot preenchido) | rejeitada: "Campo de segurança inválido" |
| Doação | `amountCents: 5000, frequency:"one_time", turnstileToken` | válida |
| Doação | `amountCents: 100` | rejeitada: "Valor mínimo de R$ 5,00." |
| Doação | `amountCents: 10.5` | rejeitada: "O valor deve ser um número inteiro em centavos." |

## Contrato HTTP comum às rotas de formulário e doação

| Etapa | Resposta | Origem (código) |
|---|---|---|
| Método diferente de POST | `405` com `Allow: POST` | `guardRequest` |
| `Content-Type` fora da lista aceita | `415` | `guardRequest` |
| `Content-Length` acima do limite | `413` | `guardRequest` |
| `Origin` presente e diferente de `PUBLIC_SITE_ORIGIN` | `403` | `guardRequest` |
| `Sec-Fetch-Site` presente e fora de `same-origin`/`same-site` | `403` | `guardRequest` |
| Corpo lido acima do limite | `413 { "error": "payload_too_large" }` | `readJson` |
| Falha de validação | `422` | schema |
| Turnstile reprovado | `403` | [`turnstile.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/security/turnstile.ts) |
| Configuração da funcionalidade inválida | `503` | [`env.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/config/env.ts) |

!!! warning "`Origin` ausente é aceito"
    A checagem só rejeita `Origin` **presente e diferente**. Clientes que não são navegadores podem omitir o cabeçalho; a proteção contra abuso depende do Turnstile e, se configurada, de regra de rate limiting na zona (R5).

### Limites de corpo por rota

| Rota | Limite | Arquivo |
|---|---|---|
| `POST /api/forms/triagem` | 8 192 bytes | [`forms/triagem.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/presentation/forms/triagem.ts) |
| `POST /api/forms/contato` | 8 192 bytes | [`forms/contato.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/presentation/forms/contato.ts) |
| `POST /api/forms/newsletter` | 1 024 bytes | [`forms/newsletter.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/presentation/forms/newsletter.ts) |
| `POST /api/donations/create-pix` | 4 096 bytes | [`donations/create-pix.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/presentation/donations/create-pix.ts) |
| `POST /api/webhooks/payment` | 64 000 bytes → `413` | [`webhooks/payment.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/presentation/webhooks/payment.ts) |

O cabeçalho `Idempotency-Key` (UUID v4, normalizado em minúsculas) é lido por `readIdempotencyKey`; o cliente gera um novo por tentativa lógica e reutiliza em retentativas de rede ([`api.ts`](https://github.com/purelifeministriesbrasil/frontend/blob/4a08dfc03ef6f5cc6adf907da5bfa454960a9add/src/lib/api.ts)).
