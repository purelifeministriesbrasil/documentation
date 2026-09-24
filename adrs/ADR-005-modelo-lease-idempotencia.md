# ADR-005 — Modelo de Lease Atómico para Idempotência de Webhooks

## Status
Aprovado (§8.2, §8.4 da Especificação Canónica v5.0).

## Contexto
Provedores de pagamento (Asaas, Mercado Pago) enviam webhooks assíncronos que podem sofrer retentativas automáticas em caso de latência de rede. Processar webhooks concorrentes com a mesma cobrança pode acarretar:
1. Duplicação de confirmações de doação e disparos repetidos de e-mails de agradecimento.
2. Race conditions entre webhooks atrasados e atualizações manuais.
3. Bloqueio permanente de retentativas legítimas caso um webhook falhe no meio do processamento e fique marcado como bloqueado.

## Decisão
1. **Instrução Atómica `claimOrResume`**:
   - Utilização de `INSERT INTO payment_webhook_events ... ON CONFLICT (provider, event_id) DO UPDATE`.
   - Concede um lease temporal de processamento (`processing_lease_until = now() + 2 minutes`).
2. **Três Comportamentos Distintos**:
   - `claimed`: Primeiro processamento do evento.
   - `resumed`: Evento que havia entrado em estado `failed` ou cujo lease expirou sem confirmação, permitindo recuperação automática em reenvios legítimos do provedor.
   - `ignored`: Evento já processado com sucesso (`processed`) ou que excedeu o número máximo de 5 tentativas.
3. **Máquina de Estados de Cobrança**:
   - O estado `failed` na cobrança é **estritamente terminal**.
   - Se o doador solicitar uma nova tentativa após falha ou expiração, gera-se uma nova `payment_charge` com `attempt_number + 1` sob a mesma `donation_intent`.

## Consequências
- **Positivas**:
  - Elimina deadlocks e duplicidades sem necessidade de locks pesados ou Redis.
  - Resiliente a interrupções de conexão em ambientes serverless como Cloudflare Workers.
