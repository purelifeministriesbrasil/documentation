# Inventário de Retenção de Dados

!!! danger "Risco aberto — condiciona a declaração de conformidade e a aprovação do go-live"
    Os conjuntos abaixo **não têm prazo de eliminação implementado**. Enquanto o ministério não decidir cada
    prazo (com validação do encarregado), não é possível declarar conformidade de retenção nem afirmar, na
    Política de Privacidade, prazos de eliminação para esses dados. Nenhum prazo foi definido pela equipe
    técnica; nenhum registro foi apagado.

Levantamento feito no código (`backend` `drizzle/0001`–`0003`, `src/infrastructure/db/schema.ts`,
`src/infrastructure/db/purge-repository.ts`) em 2026-11-12.

## O que já é expurgado

O cron diário (`0 3 * * *`, [`presentation/cron/purge.ts`](https://github.com/purelifeministriesbrasil/backend/blob/main/src/presentation/cron/purge.ts))
apaga, ao fim de `retention_until` (180 dias), os dados identificáveis de **triagem** e de **contato**,
mantendo o registro mínimo de consentimento. Exceção: ver R-RET-5.

## Conjuntos sem eliminação

| ID | Conjunto | Finalidade | Dado pessoal | Retenção implementada | Risco | Decisão institucional necessária |
|---|---|---|---|---|---|---|
| R-RET-1 | `newsletter_subscriptions` pendentes (nunca confirmadas) e canceladas | Double opt-in; prova de consentimento e de cancelamento; supressão de reenvio | Sim: `email_cipher` (e-mail cifrado), `email_hash` (HMAC com pepper), hashes de token, datas e `policy_version` | Nenhuma: o registro permanece indefinidamente | Guarda sem finalidade após a confirmação expirar (48 h) ou após o cancelamento | Prazo para pendentes; o que manter após cancelamento (ex.: só o hash, para não reenviar) e por quanto tempo |
| R-RET-2 | `donation_intents.donor_email_cipher` (e `donor_email_hash`) | Contato/recibo do doador | Sim: e-mail cifrado e hash | Nenhuma | Hoje inócuo (`PUBLIC_ENABLE_PIX_GATEWAY=false`, nenhum dado é coletado); vira guarda indefinida se o gateway for ligado | Prazo de guarda considerando obrigações fiscais e contábeis |
| R-RET-3 | `payment_webhook_events` | Idempotência e conciliação de webhooks | **Não diretamente**: a tabela guarda provedor, id e tipo do evento, status, tentativas e código de erro — sem payload | Nenhuma | Baixo; cresce sem limite | Prazo de guarda operacional |
| R-RET-4 | `audit_events` | Trilha de acessos pastorais, alterações de status e alertas de expurgo | Sim: `actor` (identificação do operador), `reason` (texto livre da justificativa), `entity_id`, `ip_hash` (pseudonimizado), `metadata` | Nenhuma | Trilha cresce sem limite; a justificativa pode conter dado de titular | Prazo de guarda (equilíbrio entre responsabilização e minimização) |
| R-RET-5 | `contact_submissions.subject` | Assunto escolhido no formulário de contato | Potencialmente: texto em claro (2–100 caracteres) | **Permanece em claro após o expurgo** — a coluna é `NOT NULL` e o expurgo não a altera | Dado pessoal digitado no assunto sobrevive ao expurgo do restante | Autorizar sobrescrever com valor neutro no expurgo (exige ajuste de código e, possivelmente, migration) |

## Impacto na Política de Privacidade

O rascunho da política (frontend#14) mantém esses prazos como campos `[PREENCHER]`, e a trava de
placeholders impede publicar a política enquanto houver lacunas. A frase sobre contato e triagem
("os dados que identificam você são apagados automaticamente") precisa considerar R-RET-5.

## Próxima ação

1. Diretoria e encarregado decidem os prazos de R-RET-1 a R-RET-5.
2. Engenharia implementa o expurgo correspondente (com testes) e atualiza esta página.
3. A política é preenchida com os prazos decididos.
