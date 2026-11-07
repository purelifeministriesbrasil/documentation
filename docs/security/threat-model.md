# Modelagem de Ameaças & AppSec Playbook

A modelagem de ameaças da Pure Life Ministries Brasil usa a categorização **STRIDE** para organizar ameaças e controles e, na seção 3, uma matriz que liga cada ameaça a evidência no código, teste e risco residual. Não há pontuação DREAD registrada.

---

## 1. Ativos Mais Críticos (*Crown Jewels*)

1. **Relatos de Triagem Pastoral**: Depoimentos confessionais de sofrimento espiritual e moral (dados potencialmente sensíveis; classificação jurídica pendente, ver [LGPD](lgpd-compliance.md)).
2. **Dados Pessoais Identificáveis (PII)**: Nomes, números de WhatsApp e endereços eletrônicos.
3. **Credenciais e Chaves Criptográficas**: string de conexão do banco (`DATABASE_URL` / Hyperdrive), chaves AES-256 (`TRIAGE_KEY_Vn`), `HASH_PEPPER`, chave da Resend e segredos de webhook do gateway financeiro.

---

## 2. Matriz de Mitigação STRIDE

| Categoria STRIDE | Vetor de Ameaça em Potencial | Controles e Mitigações Implementados |
| :--- | :--- | :--- |
| **Spoofing** (Falsificação de Identidade) | Ataque simulando webhooks de pagamento PIX para confirmar doações falsas | Asaas: token comparado em tempo constante; Mercado Pago: HMAC-SHA256 do manifesto + consulta autenticada do pagamento. Divergência de valor é auditada e não confirma a doação |
| **Tampering** (Adulteração de Dados) | Tentativa de manipular campos ou status de triagens no banco | Nenhum acesso público ao banco (RLS sem políticas + REVOKE); cifra autenticada AES-GCM com AAD; máquina de estados impede regressão de cobranças confirmadas |
| **Repudiation** (Repúdio) | Doador ou assistido contestando transação ou consentimento fornecido | Consentimento com versão da política, data e rota; `audit_events` registra leituras pastorais (com motivo) e decisões sobre webhooks |
| **Information Disclosure** (Vazamento de Informação) | Leitura não autorizada de relatos pastorais por usuários anônimos | Nenhuma role pública com privilégios (REVOKE + RLS sem políticas); cifra de campo; logs com scrubber; e-mails só como HMAC com pepper |
| **Denial of Service** (Negação de Serviço) | Bots inundando formulários com mensagens de spam e scripts automatizados | Turnstile nos formulários; `Content-Length` e corpo limitados em bytes; idempotência; cooldown de reenvio da newsletter; regra de Rate Limiting recomendada na zona |
| **Elevation of Privilege** (Elevação de Privilégio) | Usuário público tentando invocar privilégios administrativos via client JS | Frontend sem nenhuma credencial de banco ou de serviço; segredos só no Worker (`wrangler secret`), validados fail-closed |

---


## 3. Matriz Ameaça × Controle × Evidência × Teste × Risco Residual

Baseline: backend `ca9737f`, frontend `4a08dfc`. "Teste" lista a suíte do backend que exercita o controle; ausência de teste é explicitada. Os riscos residuais referenciam os itens [R1–R9](#5-riscos-e-pendencias-conhecidos).

| # | Ameaça | Controle implementado | Evidência (código) | Teste | Risco residual |
|---|---|---|---|---|---|
| T1 | Webhook de pagamento forjado | Asaas: token em tempo constante. Mercado Pago: HMAC-SHA256 do manifesto + consulta autenticada do pagamento | [`asaas.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/payments/asaas.ts), [`mercadopago.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/payments/mercadopago.ts) | `webhook.test.ts`, `gateways.test.ts` | Segredo vazado permite forjar eventos (rotacionar no gateway) |
| T2 | Reenvio/duplicação de webhook | Lease de 60 s, máx. 5 tentativas, depois `dead_letter`; transições idempotentes | [`payment.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/presentation/webhooks/payment.ts), [`state-machine.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/domains/donations/state-machine.ts) | `webhook.test.ts`, `state-machine.test.ts` | Dead letter exige ação manual; só há log |
| T3 | Cobrança PIX duplicada | `Idempotency-Key` validada; repassada ao Mercado Pago; no Asaas, conciliação por `externalReference` e bloqueio por intenção | [`create-pix-charge.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/application/usecases/create-pix-charge.ts) | `create-pix.test.ts`, `gateways.test.ts`, `integration.db.test.ts` | **R2** (mitigado): Asaas não recebe a chave; ver §5 |
| T4 | Leitura de dados pelo banco | RLS sem políticas, `REVOKE` de `anon`/`authenticated`, acesso só pelo Worker (Hyperdrive) | [`drizzle/`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/drizzle), [Hardening](../operations/database-hardening.md) | `integration.db.test.ts` (requer banco) | Depende da configuração real do Neon; não verificada aqui |
| T5 | Vazamento de dado em repouso | AES-256-GCM com AAD; e-mail só como HMAC com pepper | [Criptografia](crypto-architecture.md) | `crypto.test.ts`, `canary.test.ts` | Sem re-cifragem automática (**R7**); custódia das chaves externa |
| T6 | Vazamento em logs/e-mail | Scrubber; aviso à equipe só com código de referência | [`scrubber.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/observability/scrubber.ts) | `scrubber.test.ts`, `canary.test.ts` | Campos novos com nome não coberto pelo scrubber exigem caso no canário |
| T7 | Spam/bots nos formulários | Turnstile fail-closed (3 s de timeout); limites de bytes; `Content-Type` obrigatório | [`turnstile.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/security/turnstile.ts), [`request-guards.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/security/request-guards.ts) | `request-guards.test.ts`, `rate-limit.test.ts`, `router.test.ts` | **R5** (parcial): rate limiting em modo `log`, ainda não bloqueia; Turnstile opcional na newsletter sem JavaScript |
| T8 | CSRF/origem indevida | Checagem de `Origin` e `Sec-Fetch-Site`; CORS restrito | `request-guards.ts` | `request-guards.test.ts`, `router.test.ts` | `Origin` ausente é aceito (clientes não-navegador); mitigado por Turnstile |
| T9 | Abuso do reenvio de confirmação | Cooldown de 15 min; token de 48 h guardado só como SHA-256 | [`subscribe-newsletter.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/application/usecases/subscribe-newsletter.ts) | `newsletter.test.ts` | Sem descadastro (**R1**) |
| T10 | Retenção excessiva de dados | Expurgo diário de triagens e contatos (180 dias) | [`purge-repository.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/db/purge-repository.ts) | `purge.test.ts`, `purge-cron.test.ts` | **R1**: demais tabelas não expiram (**R3** mitigado: etapas independentes e alerta) |
| T11 | Uso indevido do acesso pastoral | `--reason` obrigatório na leitura; `audit_events` | [`pastoral-inbox.mjs`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/scripts/pastoral-inbox.mjs) | `pastoral-status.test.ts` (regras puras; o SQL da CLI não é testado) | **R4** (mitigado): `set-status` valida status e exige `--reason`; auditoria sem IP |
| T12 | Configuração incompleta em produção | Falha fechada por funcionalidade (`503`), log só com nomes de variáveis | [`env.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/config/env.ts) | `config.test.ts` | Estado real dos segredos em produção não verificável (**R6**) |
| T13 | Script injetado no site | CSP por hash gerada no build; sem `unsafe-inline`; `verify:no-inline-style` | [`public/_headers`](https://github.com/purelifeministriesbrasil/frontend/blob/4a08dfc03ef6f5cc6adf907da5bfa454960a9add/public/_headers), [`verify-no-inline-style.mjs`](https://github.com/purelifeministriesbrasil/frontend/blob/4a08dfc03ef6f5cc6adf907da5bfa454960a9add/scripts/verify-no-inline-style.mjs) | Verificações estruturais do build; sem testes unitários (**R7**) | Cabeçalhos efetivos em produção não verificados (**R6**) |
| T14 | Deriva entre contratos front/back | Schemas idênticos, mesma versão exata do Zod | `src/schemas/` dos dois repositórios | `schema-sync` (CI: aviso em PR; falha em `main`/semanal) | **R7**: sincronização continua manual; só a deriva é detectada |

!!! note "Limite da matriz"
    A matriz lista controles encontrados no código e nos testes. Ela não substitui teste de intrusão nem comprova a configuração de Cloudflare, Neon, Resend e gateways em produção.

---

## 4. Diretrizes de Desenvolvimento Seguro

- **CSP por hash / Zero Inline Style**: scripts inline gerados pelo Astro são autorizados por hash SHA-256 calculado no build (sem `'unsafe-inline'`); handlers inline e atributos `style` quebram o build.
- **Validação de Entrada Incondicional**: Todos os dados recebidos são obrigatoriamente passados por schemas estritos (`z.strictObject` do `zod/mini`), que rejeitam campos desconhecidos.
- **Sanitização de Saída**: Redução do risco de Cross-Site Scripting (XSS) pelo escape automático do Astro e do Preact; há dois pontos de HTML bruto no frontend, ambos com conteúdo gerado pelo próprio código: o JSON-LD em [`BaseLayout.astro`](https://github.com/purelifeministriesbrasil/frontend/blob/4a08dfc03ef6f5cc6adf907da5bfa454960a9add/src/layouts/BaseLayout.astro) e o SVG do QR Code em [`DonationForm.tsx`](https://github.com/purelifeministriesbrasil/frontend/blob/4a08dfc03ef6f5cc6adf907da5bfa454960a9add/src/components/donations/DonationForm.tsx). Novos usos exigem revisão.


---

## 5. Riscos e Pendências Conhecidos

Estado em 2026-11-07, depois do merge dos PRs de correção de R2 a R9 (backend #6, #7, #9, #10, #11, #12 e #13; frontend #10 e #11; documentation #6 e #7). "Mitigado" significa corrigido no código e coberto por teste; **não** significa verificado em produção, pois nada foi implantado nem executado contra serviços reais nesta etapa. R1 segue em tratamento separado.

| # | Tipo | Estado | Risco e o que mudou | Pendência |
|---|---|---|---|---|
| R1 | Implementação / LGPD | Aberto (parte 1 em andamento) | Sem descadastro ou revogação da newsletter; sem expurgo de `donation_intents`, `payment_webhook_events`, `audit_events`, `newsletter_subscriptions` Evidência: [`newsletter-repository.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/db/newsletter-repository.ts), [`purge-repository.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/db/purge-repository.ts) | Definir prazos e procedimento (encarregado/jurídico) e então implementar |
| R2 | Implementação | Mitigado | O Asaas não recebe `Idempotency-Key` (não há header documentado). Agora `asaas.ts` consulta `GET /payments?externalReference=` antes de criar, reaproveita só cobrança `PENDING` Pix, mesmo valor e QR válido, cancela (`DELETE`) cobrança vencida ou com QR expirado antes de criar outra, e bloqueia a criação em qualquer estado ambíguo; `create-pix-charge` serializa por intenção com bloqueio consultivo (`lock_timeout` 15 s, `idle_in_transaction_session_timeout` 60 s). A transação ainda fica aberta durante as chamadas ao Asaas, só que limitada | Decisão em aberto: gateways de pagamento (Asaas, Mercado Pago, PagSeguro) estão fora do escopo por ora; o teste no sandbox do Asaas (cancelamento e formato da listagem) não foi feito e fica registrado como pendência de quem retomar os pagamentos |
| R3 | Implementação | Mitigado | Triagem e contatos expurgam em etapas independentes, em lotes de 500 (até 10 lotes ou 20 s), e uma falha dispara alerta por e-mail (sem PII, no máximo um a cada 3 dias por etapa) além do log `cron.purge_step_failed`/`cron.purge_failed`. O envio real pelo Resend não foi exercitado | Confirmar que a caixa `STAFF_NOTIFICATION_EMAIL` é monitorada; runbook de execução manual segura ainda não escrito |
| R4 | Implementação | Mitigado | `pastoral-inbox set-status` valida o status por tipo (triagem: `received`, `in_review`, `contacted`, `closed`; contato: `received`, `answered`, `closed`), nunca aceita `purged`, exige `--reason` (mín. 5 caracteres) e grava a justificativa real; `from_status`/`to_status` vão em `metadata`; UPDATE e auditoria na mesma transação | A auditoria continua sem IP. O ramo SQL da CLI só tem verificação de sintaxe; as regras puras são testadas |
| R5 | Configuração / infra | Parcial | Binding de Rate Limiting do Workers por endpoint (contato 10, triagem 10, newsletter 5, create-pix 5 por 60 s por IP) em `RATE_LIMIT_MODE="log"`: só registra `rate_limit.would_block`, não bloqueia. Rotas de formulário e de doação passam a exigir `Origin` ou `Sec-Fetch-Site` válidos (403 sem nenhum) assim que o Worker for implantado. Webhooks não são afetados | Avaliar os logs e decidir trocar para `enforce`; conferir no Cloudflare os `namespace_id` 1001 a 1004; a regra de WAF/rate limiting da zona continua não verificada |
| R6 | Infra externa | Aberto (a cargo do Pedro) | Estado de produção, DNS, Resend, Hyperdrive, cabeçalhos efetivos e janelas de backup não são verificáveis pelo repositório. Há um checklist de verificação | Execução operacional por quem tem acesso às contas; o resultado deve ser registrado aqui |
| R7 | Falta de teste | Parcial | Há teste de deriva de `src/schemas` entre frontend e backend (CI: aviso em PR, falha em `main` e semanalmente) e testes das regras do `pastoral-inbox`. Re-cifragem de chaves não existe e fica **fora deste ciclo**; o frontend segue sem testes unitários | Decidir se e quando criar a re-cifragem e testes de frontend |
| R8 | Processo | Mitigado | `documentation` valida `mkdocs build --strict` em PR; backend e frontend fixam `packageManager: pnpm@12.18.0` e a CI verifica a versão; Wrangler atualizado de 3 para 4 (backend #14) | Primeiro deploy manual do Worker com Wrangler 4 deve ser conferido |
| R9 | Evidência | Mitigado | Medidas do ADR-009 refeitas e com metodologia registrada (ADR-009 §5) | Remedir após mudanças relevantes de bundle ou imagem |
