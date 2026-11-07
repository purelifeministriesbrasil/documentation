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
| T3 | Cobrança PIX duplicada | `Idempotency-Key` validada; repassada ao Mercado Pago | [`create-pix-charge.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/application/usecases/create-pix-charge.ts) | `create-pix.test.ts` | **R2**: Asaas não recebe a chave |
| T4 | Leitura de dados pelo banco | RLS sem políticas, `REVOKE` de `anon`/`authenticated`, acesso só pelo Worker (Hyperdrive) | [`drizzle/`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/drizzle), [Hardening](../operations/database-hardening.md) | `integration.db.test.ts` (requer banco) | Depende da configuração real do Neon; não verificada aqui |
| T5 | Vazamento de dado em repouso | AES-256-GCM com AAD; e-mail só como HMAC com pepper | [Criptografia](crypto-architecture.md) | `crypto.test.ts`, `canary.test.ts` | Sem re-cifragem automática (**R7**); custódia das chaves externa |
| T6 | Vazamento em logs/e-mail | Scrubber; aviso à equipe só com código de referência | [`scrubber.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/observability/scrubber.ts) | `scrubber.test.ts`, `canary.test.ts` | Campos novos com nome não coberto pelo scrubber exigem caso no canário |
| T7 | Spam/bots nos formulários | Turnstile fail-closed (3 s de timeout); limites de bytes; `Content-Type` obrigatório | [`turnstile.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/security/turnstile.ts), [`request-guards.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/security/request-guards.ts) | `request-guards.test.ts`, `router.test.ts` | **R5**: sem rate limiting no Worker; Turnstile opcional na newsletter sem JavaScript |
| T8 | CSRF/origem indevida | Checagem de `Origin` e `Sec-Fetch-Site`; CORS restrito | `request-guards.ts` | `request-guards.test.ts`, `router.test.ts` | `Origin` ausente é aceito (clientes não-navegador); mitigado por Turnstile |
| T9 | Abuso do reenvio de confirmação | Cooldown de 15 min; token de 48 h guardado só como SHA-256 | [`subscribe-newsletter.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/application/usecases/subscribe-newsletter.ts) | `newsletter.test.ts` | Sem descadastro (**R1**) |
| T10 | Retenção excessiva de dados | Expurgo diário de triagens e contatos (180 dias) | [`purge-repository.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/db/purge-repository.ts) | `purge.test.ts` | **R1**, **R3**: demais tabelas não expiram; falha em triagem aborta contatos |
| T11 | Uso indevido do acesso pastoral | `--reason` obrigatório na leitura; `audit_events` | [`pastoral-inbox.mjs`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/scripts/pastoral-inbox.mjs) | Nenhum (**R7**) | **R4**: `set-status` sem validação; auditoria sem IP |
| T12 | Configuração incompleta em produção | Falha fechada por funcionalidade (`503`), log só com nomes de variáveis | [`env.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/config/env.ts) | `config.test.ts` | Estado real dos segredos em produção não verificável (**R6**) |
| T13 | Script injetado no site | CSP por hash gerada no build; sem `unsafe-inline`; `verify:no-inline-style` | [`public/_headers`](https://github.com/purelifeministriesbrasil/frontend/blob/4a08dfc03ef6f5cc6adf907da5bfa454960a9add/public/_headers), [`verify-no-inline-style.mjs`](https://github.com/purelifeministriesbrasil/frontend/blob/4a08dfc03ef6f5cc6adf907da5bfa454960a9add/scripts/verify-no-inline-style.mjs) | Verificações estruturais do build; sem testes unitários (**R7**) | Cabeçalhos efetivos em produção não verificados (**R6**) |
| T14 | Deriva entre contratos front/back | Schemas idênticos, mesma versão exata do Zod | `src/schemas/` dos dois repositórios | Nenhum automatizado | Sincronização manual (**R7**) |

!!! note "Limite da matriz"
    A matriz lista controles encontrados no código e nos testes. Ela não substitui teste de intrusão nem comprova a configuração de Cloudflare, Neon, Resend e gateways em produção.

---

## 4. Diretrizes de Desenvolvimento Seguro

- **CSP por hash / Zero Inline Style**: scripts inline gerados pelo Astro são autorizados por hash SHA-256 calculado no build (sem `'unsafe-inline'`); handlers inline e atributos `style` quebram o build.
- **Validação de Entrada Incondicional**: Todos os dados recebidos são obrigatoriamente passados por schemas estritos (`z.strictObject` do `zod/mini`), que rejeitam campos desconhecidos.
- **Sanitização de Saída**: Redução do risco de Cross-Site Scripting (XSS) pelo escape automático do Astro e do Preact; há dois pontos de HTML bruto no frontend, ambos com conteúdo gerado pelo próprio código: o JSON-LD em [`BaseLayout.astro`](https://github.com/purelifeministriesbrasil/frontend/blob/4a08dfc03ef6f5cc6adf907da5bfa454960a9add/src/layouts/BaseLayout.astro) e o SVG do QR Code em [`DonationForm.tsx`](https://github.com/purelifeministriesbrasil/frontend/blob/4a08dfc03ef6f5cc6adf907da5bfa454960a9add/src/components/donations/DonationForm.tsx). Novos usos exigem revisão.


---

## 5. Riscos e Pendências Conhecidos

Itens independentes, **não resolvidos** por esta documentação. Nenhum foi corrigido no código nem na infraestrutura; cada um exige decisão e trabalho próprios.

| # | Tipo | Risco | Evidência | Decisão/ação pendente |
|---|---|---|---|---|
| R1 | Implementação / LGPD | Sem descadastro ou revogação da newsletter; sem expurgo de `donation_intents`, `payment_webhook_events`, `audit_events`, `newsletter_subscriptions` | [`newsletter-repository.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/db/newsletter-repository.ts), [`purge-repository.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/db/purge-repository.ts) | Definir prazos e procedimento (encarregado/jurídico) e então implementar |
| R2 | Implementação | A cobrança Asaas **não** recebe a `Idempotency-Key` (só `externalReference`). Se o processo falhar entre criar no Asaas e gravar `payment_charges`, uma nova tentativa cria outra cobrança. O comentário do caso de uso sugere repasse da chave, o que só vale para o Mercado Pago | `asaas.ts`, `create-pix-charge.ts` | Definir estratégia de idempotência para o Asaas (ou reconciliar por `externalReference`) |
| R3 | Implementação | Expurgo: falha na triagem aborta o de contatos na mesma execução; limite de 500 por tipo por dia; só há log (`cron.purge_failed`), sem alerta nem procedimento manual documentado | [`cron/purge.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/presentation/cron/purge.ts), `index.ts` | Isolar as etapas; configurar alerta; documentar execução manual segura |
| R4 | Implementação | `pastoral-inbox set-status` não valida o status; para contatos, `in_review`/`contacted` violam o CHECK (aceita `received`, `answered`, `closed`, `purged`). Não exige justificativa na mudança de status; a auditoria registra o próprio status como motivo | `pastoral-inbox.mjs` | Validar o conjunto de status por tipo e exigir `--reason` |
| R5 | Configuração / infra | Sem rate limiting no Worker; regra de WAF apenas recomendada (não verificável); `Origin` ausente é aceito | `request-guards.ts` | Configurar e verificar regra de rate limiting na zona |
| R6 | Infra externa | Estado de produção, DNS, Resend, Hyperdrive, cabeçalhos efetivos e janelas de backup não verificáveis pelo repositório | — | Verificação operacional por quem tem acesso às contas |
| R7 | Falta de teste | Re-cifragem inexistente e não testada; sem teste de deriva de schemas; frontend sem testes unitários; `pastoral-inbox` sem teste | `tests/`, `package.json` | Decidir prioridade de cobertura |
| R8 | Processo | Documentação sem validação em PR; pnpm 12 declarado na CI, validação local com 10.28; Wrangler 3 em uso | `.github/workflows/deploy-pages.yml`, [Testes e CI/CD](../quality/testing-and-cicd.md) | Ver recomendação futura na página de CI/CD |
| R9 | Evidência | Medidas do ADR-009 (JS 19–30 KB gzip, 15 KB de imagem) e metas de desempenho não reverificadas | — | Remedir quando necessário |
