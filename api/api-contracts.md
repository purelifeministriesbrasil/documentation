# Especificação de Contratos de API: purelife-api

**Catálogo Oficial de Endpoints, Request Guards e Exemplos de Integração**  
**Versão:** 1.0.0  
**Host de Produção:** `https://purelife-api.purelifebrasil.org`  
**Runtime:** Cloudflare Workers (V8 Isolates)  
**Validação:** Zod `.strict()` compartilhado via `purelife-contracts`

---

## 1. Matriz de Endpoints e Restrições de Borda

| Rota | Método | Formato Aceito | Rate Limit por IP | Limite de Corpo | Cache na Borda | Autenticação |
|---|:---:|---|---|---:|:---:|:---:|
| `/health` | `GET` | — | 60 req / min | — | `no-store` | Pública |
| `/api/forms/triagem` | `POST` | `application/json` | 3 req / hora | 8 KB (UTF-8) | `no-store, private` | Turnstile Token |
| `/api/forms/contato` | `POST` | `application/json` | 5 req / hora | 8 KB (UTF-8) | `no-store` | Turnstile Token |
| `/api/forms/newsletter` | `POST` | `application/json`, `application/x-www-form-urlencoded` | 5 req / hora | 1 KB (UTF-8) | `no-store` | Turnstile Token |
| `/api/donations/create-pix` | `POST` | `application/json` | 5 req / 10 min | 2 KB (UTF-8) | `no-store` | Turnstile Token + Idempotency-Key |
| `/api/webhooks/payment` | `POST` | `application/json` | 120 req / min | 64 KB (UTF-8) | `no-store` | HMAC-SHA256 Signature |

---

## 2. Detalhamento dos Endpoints com Exemplos de Chamada

### POST `/api/forms/triagem`
Processa a submissão confidencial de triagem pastoral. Os campos sensíveis são cifrados em repouso com **AES-256-GCM + AAD** antes de serem persistidos no Neon Postgres.

<!-- tabs:start -->

#### **cURL**

```bash
curl -X POST https://purelife-api.purelifebrasil.org/api/forms/triagem \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "João Carlos de Souza",
    "email": "joao.souza@email.com",
    "phone": "61988887777",
    "programInterest": "residencial",
    "contactChannel": "whatsapp",
    "report": "Busco ajuda após 8 anos de luta secreta contra compulsão em pornografia.",
    "isAdult": true,
    "policyVersion": "2026-09-01",
    "turnstileToken": "0.X_TOKEN_CLOUDFLARE_TURNSTILE_SAMPLE_XXX"
  }'
```

#### **TypeScript (Fetch API)**

```typescript
import type { TriageSubmissionInput, TriageSubmissionResult } from 'purelife-contracts';

const payload: TriageSubmissionInput = {
  fullName: "João Carlos de Souza",
  email: "joao.souza@email.com",
  phone: "61988887777",
  programInterest: "residencial",
  contactChannel: "whatsapp",
  report: "Busco ajuda após 8 anos de luta secreta contra compulsão em pornografia.",
  isAdult: true,
  policyVersion: "2026-09-01",
  turnstileToken: "0.X_TOKEN_CLOUDFLARE_TURNSTILE_SAMPLE_XXX"
};

const response = await fetch("https://purelife-api.purelifebrasil.org/api/forms/triagem", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
});

const data: TriageSubmissionResult = await response.json();
console.log("Protocolo de Referência:", data.referenceCode);
```

#### **Resposta Sucesso (201 Created)**

```json
{
  "success": true,
  "referenceCode": "PLM-849201",
  "message": "Triagem confidencial recebida com sucesso. A equipe pastoral entrará em contato com absoluto sigilo."
}
```

#### **Resposta Erro de Validação (400 Bad Request)**

```json
{
  "success": false,
  "error": "validation_failed",
  "issues": [
    {
      "field": "isAdult",
      "message": "É obrigatório declarar maioridade civil (18 anos) para envio de triagem."
    }
  ]
}
```

<!-- tabs:end -->

---

### POST `/api/donations/create-pix`
Gera uma cobrança Pix dinâmica com QR Code e chave Copia e Cola para doação eclesiástica.

<!-- tabs:start -->

#### **cURL**

```bash
curl -X POST https://purelife-api.purelifebrasil.org/api/donations/create-pix \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: a1b2c3d4-e5f6-7890-abcd-ef1234567890" \
  -d '{
    "amountCents": 15000,
    "donorName": "Carlos Eduardo Mendes",
    "donorEmail": "carlos.mendes@email.com",
    "donorCpf": "12345678901",
    "turnstileToken": "0.X_TOKEN_CLOUDFLARE_TURNSTILE_SAMPLE_XXX"
  }'
```

#### **TypeScript**

```typescript
import type { CreatePixInput, CreatePixResult } from 'purelife-contracts';

const payload: CreatePixInput = {
  amountCents: 15000, // R$ 150,00
  donorName: "Carlos Eduardo Mendes",
  donorEmail: "carlos.mendes@email.com",
  donorCpf: "12345678901",
  turnstileToken: "0.X_TOKEN_CLOUDFLARE_TURNSTILE_SAMPLE_XXX"
};

const response = await fetch("https://purelife-api.purelifebrasil.org/api/donations/create-pix", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Idempotency-Key": crypto.randomUUID()
  },
  body: JSON.stringify(payload)
});

const pixData: CreatePixResult = await response.json();
```

#### **Resposta Sucesso (200 OK)**

```json
{
  "chargeId": "pay_982347109283",
  "pixCopyPaste": "00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266141740005204000053039865406150.005802BR5913Pure Life BR6008Brasilia62070503***6304E8A2",
  "expiresAt": "2026-09-24T21:15:00.000Z",
  "amountFormatted": "R$ 150,00"
}
```

<!-- tabs:end -->

---

### POST `/api/webhooks/payment`
Endpoint interno restrito para recebimento de notificações assíncronas do gateway financeiro.

<!-- tabs:start -->

#### **cURL Simulação de Teste**

```bash
curl -X POST https://purelife-api.purelifebrasil.org/api/webhooks/payment \
  -H "Content-Type: application/json" \
  -H "X-Asaas-Signature: 8f4b23c91a0d8e7f..." \
  -d '{
    "event": "PAYMENT_RECEIVED",
    "payment": {
      "id": "pay_982347109283",
      "value": 150.00,
      "netValue": 148.50,
      "billingType": "PIX",
      "status": "RECEIVED",
      "confirmedDate": "2026-09-24"
    }
  }'
```

#### **Comportamento e Respostas**

- **`200 OK`:** Transação compensada com sucesso e e-mail transacional disparado.
- **`204 No Content`:** Notificação já processada previamente (idempotência confirmada via lock no banco).
- **`401 Unauthorized`:** Assinatura HMAC inválida ou ausente no cabeçalho.
- **`409 Conflict`:** Concorrência detectada; processamento bloqueado para prevenir cobrança em duplicidade.

<!-- tabs:end -->
