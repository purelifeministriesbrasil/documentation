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
| `usecase.infrastructure_failure` | error | `operation`, `error`, `cause` (só código/nome do erro) | `presentation/http.ts` — após backend#16; antes, falhas de banco nos casos de uso não geravam log |
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

## 7. Monitoramento externo e alertas (guia de configuração)

!!! warning "Recomendação, não configurado"
    Nada desta seção existe hoje no código ou foi verificado nas contas. O passo a passo para o responsável está em `entrega-cliente/guia-pedro.md` (pasta de arquivos do projeto). Os nomes de menu variam conforme o plano; confirme no painel.

### 7.1 Monitor de disponibilidade (uptime)

| O que monitorar | URL | Critério de sucesso | Intervalo sugerido |
|---|---|---|---|
| Site | `https://purelifeministriesbrasil.org/` | HTTP 200 e texto "Pure Life Ministries" | 5 min |
| API (Worker no ar) | `https://api.purelifeministriesbrasil.org/health` | HTTP 200 e `"status":"healthy"` | 5 min |
| Sitemap | `https://purelifeministriesbrasil.org/sitemap-index.xml` | HTTP 200 | 1 h |

Qualquer serviço de uptime com alerta por e-mail serve (Cloudflare Health Checks, se o plano incluir, ou um serviço externo com plano gratuito). O destino do alerta deve ser uma caixa que alguém lê (a mesma de `STAFF_NOTIFICATION_EMAIL` ou outra definida pelo ministério). **Limite:** `/health` não consulta o banco; 200 prova só que o Worker responde. Um erro de banco só aparece nos logs (`request.unhandled_error`) ou no teste ponta a ponta.

### 7.2 Alertas sobre os logs

| Evento | Gravidade | Ação esperada |
|---|---|---|
| `cron.purge_failed`, `cron.purge_step_failed`, `cron.purge_skipped` | Alta | Expurgo não rodou ou falhou numa etapa: conferir o e-mail de alerta e os logs do período (ainda não há runbook de execução manual; pendência R3) |
| `config.invalid` | Alta | Segredo ausente ou inválido (aparecem só os nomes); corrigir o segredo |
| `request.unhandled_error` | Alta | Abrir o log do período e identificar o `code` |
| `webhook.dead_letter` | Média | Só relevante se um gateway for adotado |
| `rate_limit.would_block` / `rate_limit.blocked` | Informativa | Avaliar volume antes de trocar `RATE_LIMIT_MODE` para `enforce` |
| `email.send_failed` | Média | Verificar domínio e chave no Resend |

Consulta manual, sem painel: `cd backend && pnpm exec wrangler tail --format json` (somente leitura) e filtre por `event`. No painel: *Workers e Pages → purelife-api → Observabilidade*, filtro por `event`.

### 7.3 O que fazer quando um alerta chegar

1. Registrar data/hora e o evento.
2. Reproduzir com `curl` o endpoint afetado (apenas leitura).
3. Se for segredo/configuração, corrigir pelo painel ou `wrangler secret put` (nunca colar valores em chats ou issues).
4. Se for o banco, ver o status do Neon e o [runbook de backup](backup-recovery.md).
5. Anotar a causa e o que mudou.
