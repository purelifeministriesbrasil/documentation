# ADR-005: Modelo de Lease Atômico para Idempotência de Webhooks

- **Status**: Aprovado
- **Data**: 2026-09-24
- **Decisores**: Equipe de Engenharia Pure Life Ministries Brasil


!!! info "Situação atual da implementação (auditoria de 07/11/2026)"
    O modelo de lease continua vigente, mas os valores abaixo são os da decisão original. No código:

    - Lease de **60 segundos** e no máximo **5 tentativas** (depois, `dead_letter`), não 120 s
      ([`presentation/webhooks/payment.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/presentation/webhooks/payment.ts)).
    - Só o **status** do evento é persistido (`received`, `processing`, `processed`, `ignored`, `failed`, `dead_letter`);
      não há resposta em cache. Duplicado já processado: `200 {"duplicate": true}`; lease ativo: `409`.
    - Implementação: [`infrastructure/db/idempotency.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/db/idempotency.ts) (`INSERT … ON CONFLICT DO UPDATE` condicional).

---

## 1. Contexto e Motivação

Gateways de pagamento (como Asaas e Mercado Pago) utilizam retentativas automáticas (*at-least-once delivery*) no envio de webhooks de notificação de PIX e cartão. Em caso de instabilidade transitória de rede ou lentidão temporária, a mesma notificação de confirmação de pagamento pode chegar em duplicidade ou em paralelo simultâneo à API.

A ausência de tratamento de concorrência estrita pode provocar:

1. Confirmações duplicadas de doações.
2. Disparo duplicado de recibos fiscais ou e-mails de agradecimento.
3. Condições de corrida (*race conditions*) corrompendo o saldo e status financeiro.

---

## 2. Decisão

Adotar o **Padrão de Lease Atômico de Idempotência** no processamento de webhooks financeiros:

```mermaid
flowchart TD
    Webhook[Webhook de Pagamento Recebido] --> CheckLock{Tenta Adquirir Lease Atômico com TTL}
    CheckLock -->|Sucesso: Lock Adquirido| Process[Executa Lógica de Negócio e Atualiza Status]
    Process --> Release[Salva Resultado e Libera Lease]
    CheckLock -->|Falha: Em Processamento| Reject409[Retorna 409 Conflict ou 200 OK Idempotente]
    CheckLock -->|Falha: Já Concluído Anteriormente| ReturnCached[Retorna 200 OK com Resposta em Cache]
```

### Regras do Mecanismo:
1. **Identificador Canônico**: Baseado no `id` único do evento ou chave de idempotência fornecida pelo gateway.
2. **Lease com TTL (Time-To-Live)**: O lock expira automaticamente em 120 segundos caso o worker falhe catastroficamente durante a execução, evitando deadlocks permanentes.
3. **Persistência do Resultado**: Após a conclusão bem-sucedida, a resposta de sucesso é armazenada para responder requisições repetidas sem reprocessar a lógica de negócio.

---

## 3. Consequências

### Impactos Positivos:
- **Segurança Transacional**: Zero risco de processamento duplicado de ofertas ou doações.
- **Resiliência a Retentativas**: O sistema responde com sucesso imediato caso o gateway reenvie a mesma notificação após confirmação.
