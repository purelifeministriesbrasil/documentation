# Especificação de Contratos de API: purelife-api

Catálogo de endpoints expostos pelo Cloudflare Worker `purelife-api`, seus esquemas de entrada e regras de segurança.

## 1. Matriz de Endpoints e Restrições de Borda

| Rota | Método | Formato Aceito | Rate Limit por IP | Limite de Corpo | Cache na Borda |
|---|:---:|---|---|---:|:---:|
| `/health` | `GET` | — | 60 req / min | — | `no-store` |
| `/api/forms/triagem` | `POST` | `application/json` | 3 req / hora | 8 KB (UTF-8) | `no-store, private` |
| `/api/forms/contato` | `POST` | `application/json` | 5 req / hora | 8 KB (UTF-8) | `no-store` |
| `/api/forms/newsletter` | `POST` | `application/json`, `application/x-www-form-urlencoded` | 5 req / hora | 1 KB (UTF-8) | `no-store` |
| `/api/donations/create-pix` | `POST` | `application/json` | 5 req / 10 min | 2 KB (UTF-8) | `no-store` |
| `/api/webhooks/payment` | `POST` | `application/json` | 120 req / min | 64 KB (UTF-8) | `no-store` |

---

## 2. Detalhamento dos Payloads

### POST `/api/forms/triagem`
- **Validação de Entrada (`triageSubmissionSchema`)**:
  - `fullName`: string (mínimo 3 caracteres, máximo 120)
  - `email`: string no formato e-mail válido
  - `phone`: string (formato nacional E.164 ou nacional com DDD)
  - `programInterest`: `"residencial" | "online" | "esposas" | "indefinido"`
  - `contactChannel`: `"email" | "telefone" | "whatsapp"`
  - `report`: string opcional (máx. 4.000 caracteres)
  - `isAdult`: literal `true` obrigatório
  - `policyVersion`: string de data ISO (`YYYY-MM-DD`)
  - `turnstileToken`: string de verificação de bot
- **Respostas**:
  - `201 Created`: `{ "success": true, "referenceCode": "PLM-XXXXXX" }`
  - `400 Bad Request`: `{ "error": "validation_failed", "issues": [...] }`
  - `413 Payload Too Large`: `{ "error": "payload_too_large" }`
  - `429 Too Many Requests`: `{ "error": "too_many_requests" }`

### POST `/api/donations/create-pix`
- **Validação de Entrada (`createPixSchema`)**:
  - `amountCents`: integer entre 500 (R$ 5,00) e 5.000.000 (R$ 50.000,00)
  - `donorName`: string (máx. 120 caracteres)
  - `donorEmail`: string no formato e-mail
  - `donorCpf`: string de CPF (11 dígitos limpos)
  - `turnstileToken`: string de verificação de bot
- **Respostas**:
  - `200 OK`: `{ "chargeId": "...", "pixCopyPaste": "000201...", "expiresAt": "..." }`

### POST `/api/webhooks/payment`
- **Autenticação**: Header `X-Asaas-Signature` ou `X-Signature` HMAC-SHA256 em tempo constante.
- **Processamento**: Modelo de lease atômico `claimOrResume` em SQL único. Retorna `204 No Content` para requisições já processadas ou duplicadas.
