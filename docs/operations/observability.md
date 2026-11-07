# Observabilidade, Telemetria & Monitoramento

Esta página descreve o que o backend **realmente emite** (baseline `ca9737f`) e separa o que é implementado do que depende de configuração externa. A regra central é a privacidade pastoral: a telemetria mede a saúde técnica, nunca o conteúdo dos relatos.

---

## 1. Princípio de sigilo

!!! danger "Regra inviolável"
    Nenhum relato, nome, telefone, e-mail ou cabeçalho de autorização pode ir para logs. O Worker passa todo contexto de log por [`scrubber.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/observability/scrubber.ts).

O scrubber substitui por `[REDACTED]` chaves como `fullName`, `name`, `email`, `phone`, `report`, `message`, `pixCopyPaste`, `authorization`, `cookie`, `x-signature` e qualquer chave que **contenha** `email`, `phone`, `token`, `secret`, `password`, `cipher`, `plaintext` ou `apikey`. Funciona recursivamente. Testes: [`scrubber.test.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/tests/scrubber.test.ts) e [`canary.test.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/tests/canary.test.ts).

Além disso, o código evita colocar mensagens de erro de drivers nos logs: [`errorCode()`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/observability/logger.ts) registra só o `code` ou o nome do erro.

## 2. Formato real do log

[`logger.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/observability/logger.ts) escreve **uma linha JSON** por evento em `console.log/warn/error`. O Worker tem `[observability] enabled = true` em [`wrangler.toml`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/wrangler.toml), então as linhas ficam no Workers Logs da Cloudflare.

```json
{"level":"info","event":"cron.purge_completed","ts":"2026-11-07T03:00:01.234Z","triagePurged":3,"contactsPurged":1}
```

| Campo | Origem |
|---|---|
| `level` | `info`, `warn` ou `error` |
| `event` | Nome do evento (catálogo abaixo) |
| `ts` | ISO 8601 no momento da emissão |
| demais | Contexto do evento, após o scrubber |

!!! warning "Campos que não existem"
    Versões anteriores desta página mostravam `requestId`, `clientIp`, `method`, `path`, `statusCode`, `durationMs`, `turnstileStatus` e `version`. **O código não registra log por requisição nem esses campos.** Não há correlação por `requestId` implementada, e o IP do cliente não é registrado.

## 3. Catálogo de eventos

| Evento | Nível | Contexto | Origem |
|---|---|---|---|
| `request.unhandled_error` | error | `code` | [`index.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/index.ts) |
| `config.invalid` | error | `feature`, `invalidKeys` (só nomes) | `index.ts` |
| `turnstile.rejected` | info | `codes` | [`turnstile.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/security/turnstile.ts) |
| `turnstile.siteverify_http_error` | warn | `status` | `turnstile.ts` |
| `turnstile.siteverify_unreachable` | warn | `reason` | `turnstile.ts` |
| `email.notifications_disabled` | warn | `invalidKeys` | `index.ts` |
| `email.send_failed` | warn | `kind`, `status`/`reason` | [`resend.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/email/resend.ts) |
| `asaas.request_failed` / `asaas.charge_rejected` / `asaas.qrcode_rejected` | warn | `path`, `status`, `reason` | [`asaas.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/payments/asaas.ts) |
| `mercadopago.request_failed` / `mercadopago.charge_rejected` | warn | `status`, `reason` | [`mercadopago.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/payments/mercadopago.ts) |
| `webhook.rejected` | warn | `provider`, `reason` | [`webhooks/payment.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/presentation/webhooks/payment.ts) |
| `webhook.event_ignored` | warn | `provider`, `eventId`, `reason` | `webhooks/payment.ts` |
| `webhook.dead_letter` | error | `provider`, `eventId` | `webhooks/payment.ts` |
| `cron.purge_completed` | info | `triagePurged`, `contactsPurged` | [`cron/purge.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/presentation/cron/purge.ts) |
| `cron.purge_skipped` | error | `reason` | `index.ts` |
| `cron.purge_step_failed` | error | `step`, `reference`, `code`, `purgedSoFar` | `cron/purge.ts` |
| `cron.purge_failed` | error | `code` | `index.ts` |
| `cron.purge_alert_suppressed` / `cron.purge_alert_not_sent` / `cron.purge_alert_failed` / `cron.purge_alert_unavailable` | info / warn | `step`, `reference` | `cron/purge.ts` |
| `cron.purge_budget_reached` / `cron.purge_batch_cap_reached` | warn | `step` | `cron/purge.ts` |
| `rate_limit.would_block` / `rate_limit.blocked` | warn | `endpoint`, `mode` | `index.ts` (`would_block` no modo `log`; `blocked` em `enforce`, com resposta 429) |
| `rate_limit.binding_missing` / `rate_limit.check_failed` | warn | `endpoint` | `infrastructure/security/rate-limit.ts` (fail-open) |
| `asaas.reconcile_blocked` | warn | `reason` | `infrastructure/payments/asaas.ts` |
| `asaas.charge_reused` / `asaas.stale_charge_cancelled` | info | (sem PII) | `asaas.ts` |

## 4. Respostas HTTP e classificação

| Status | Quando | Observação |
|---|---|---|
| 400 | JSON inválido; assinatura de webhook inválida ou payload malformado | |
| 405 | Método diferente de POST no webhook | |
| 403 | Turnstile rejeitado, origem/`Sec-Fetch-Site` inválidos | Ver [Fluxos](../architecture/sequence-diagrams.md) |
| 409 | Webhook com lease ativo | O provedor reenvia |
| 413 | Corpo acima do limite de bytes | |
| 422 | Falha de validação do schema | |
| 502 | Gateway de pagamento indisponível ao criar PIX | |
| 503 | Configuração ausente/inválida da funcionalidade, banco indisponível, provedor indisponível ao validar webhook | Falha fechada |
| 500 | Exceção não tratada (`request.unhandled_error`) ou falha ao processar evento de webhook (o gateway reenvia) | |

Os limites exatos de bytes por rota estão na página de [Schemas comuns](../schemas/common-schema.md).

## 5. Health check

`GET /health` ([`health.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/presentation/health.ts)) responde 200 com `{"status":"healthy","service":"purelife-api","timestamp":"…"}` e `Cache-Control: no-store`, **sem tocar no banco** (portanto não prova que o banco está acessível). Não há campo `version`.

## 6. O que não está implementado ou verificado

| Item | Situação |
|---|---|
| Métricas, tracing, SLOs numéricos (latência, taxa de erro) | **Não implementados no repositório.** Valores citados em versões antigas eram metas sem medição |
| Alertas (5xx, falha de webhook, falha de expurgo) | **Não configurados no código.** Podem existir no painel da Cloudflare; não verificado nesta auditoria |
| Retenção e destino dos Workers Logs | Dependem do plano e da configuração da conta; não verificado |
| Alerta para `cron.purge_failed` / `cron.purge_skipped` | Falha de uma etapa do expurgo envia e-mail (Resend, sem PII) para `STAFF_NOTIFICATION_EMAIL`, no máximo um a cada 3 dias por etapa; o envio real ainda não foi exercitado. O evento `cron.purge_skipped` continua só em log |

### Recomendação operacional (pendente de decisão)

Definir, na conta Cloudflare, alertas sobre os eventos `webhook.dead_letter`, `cron.purge_failed`, `cron.purge_skipped` e `request.unhandled_error`, e consultar com `wrangler tail`. Ver [Deploy](deployment.md).
