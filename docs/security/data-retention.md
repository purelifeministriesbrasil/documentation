# Inventário de Retenção de Dados

!!! success "Em vigor desde 21/11/2026"
    Os prazos abaixo foram **adotados pela coordenação do projeto** (sugestões técnicas), **implementados** (`backend`,
    PR #34) e **colocados em produção em 21/11/2026**: migration `0004` aplicada (com backup antes) e API publicada.
    A primeira execução automática é a das 03:00 UTC de 22/11/2026 (ver [Colocar em vigor](#colocar-em-vigor)). A validação final dos prazos
    cabe ao ministério e ao encarregado de dados; se algum mudar, altere
    [`retention-policy.ts`](https://github.com/purelifeministriesbrasil/backend/blob/main/src/application/retention-policy.ts),
    os testes e esta página. A Política de Privacidade já pode afirmar estes prazos.

Levantamento feito no código (`backend` `drizzle/0001`–`0004`, `src/infrastructure/db/schema.ts`,
`purge-repository.ts` e `retention-repository.ts`).

## O que é eliminado automaticamente

O cron diário (`0 3 * * *`, [`presentation/cron/purge.ts`](https://github.com/purelifeministriesbrasil/backend/blob/main/src/presentation/cron/purge.ts))
executa quatro etapas independentes (a falha de uma não bloqueia as outras e gera um aviso à equipe, sem dados
pessoais):

| Etapa | Conjunto | Regra | Resultado |
|---|---|---|---|
| `triage` | Triagens | 180 dias (`retention_until`) | Dados identificáveis apagados; fica o registro mínimo de consentimento |
| `contacts` | Contatos | 180 dias | Dados identificáveis **e o assunto** apagados (o assunto vira `[removido]`); fica o consentimento |
| `newsletter` | Inscrições pendentes | **7 dias** após o último pedido de confirmação | Linha apagada (o link expira em 48 h, então já não pode ser confirmada) |
| `newsletter` | Inscrições canceladas | **30 dias** após o cancelamento | E-mail cifrado e tokens apagados; fica só `email_hash` (irreversível) como lista de supressão |
| `housekeeping` | Trilha de auditoria (`audit_events`) | **1 ano** | Eventos apagados |
| `housekeeping` | Webhooks de pagamento concluídos (`payment_webhook_events`) | **1 ano** (`processed`, `ignored`, `dead_letter`) | Eventos apagados; os que falharam continuam para investigação |

Quem se inscreve de novo depois de ter sido anonimizado reabre o consentimento (confirmação por e-mail) e volta a
ter o e-mail guardado cifrado, como em uma inscrição nova.

## Inventário e decisões

| ID | Conjunto | Dado pessoal | Decisão | Estado |
|---|---|---|---|---|
| R-RET-1 | `newsletter_subscriptions` | `email_cipher`, `email_hash`, hashes de token | Pendentes 7 dias; canceladas 30 dias, mantendo só o hash | **Em vigor** (migration `0004` aplicada em 21/11/2026) |
| R-RET-2 | `donation_intents.donor_email_cipher` | E-mail cifrado do doador | **Sem decisão**: só existe se o gateway de pagamento for ligado (`PUBLIC_ENABLE_PIX_GATEWAY=false` hoje); decidir com o contador antes de ligar | Não aplicável hoje |
| R-RET-3 | `payment_webhook_events` | Não diretamente (sem payload) | 1 ano para eventos concluídos | **Em vigor** |
| R-RET-4 | `audit_events` | `actor`, `reason` (texto livre), `ip_hash`, `metadata` | 1 ano | **Em vigor** |
| R-RET-5 | `contact_submissions.subject` | Texto livre em claro (2–100 caracteres) | Apagar junto com o restante (valor neutro `[removido]`) | Implementado (não exige migration) |

## Colocar em vigor

Ordem seguida em produção (a API nova usa a coluna `purged_at`), registrada para futuras mudanças de prazo:

1. **Backup** do banco (`./go-live-final.sh production backup`; exige as autorizações do operador).
2. **Migration `0004`** (`./go-live-final.sh production migrate`): aditiva; relaxa `NOT NULL` do e-mail cifrado,
   adiciona `purged_at`, duas `CHECK` e quatro índices.
3. **Deploy API** (Actions → Deploy API → destino `domain`).
4. Conferir no log do Worker o evento `cron.purge_completed` na próxima execução (03:00 UTC) e que
   `failedSteps` está vazio.

Reversão: a migration é aditiva e reversível; para voltar, publique a versão anterior da API (que ignora
`purged_at`). Linhas já anonimizadas não são restauráveis (o e-mail foi apagado de propósito).

## Impacto na Política de Privacidade

A política deve citar os prazos acima (180 dias para triagem e contato; 7 e 30 dias para a newsletter; 1 ano para
a trilha de auditoria) e **não** pode afirmar prazo para dados de doadores enquanto o gateway estiver desligado.
O PR frontend#14 mantém os demais campos como `[PREENCHER]` (dados da instituição, encarregado e escolhas
jurídicas), e a trava de placeholders impede a publicação enquanto houver lacunas.

## Próxima ação

1. Conferir, depois das 03:00 UTC de 22/11/2026, o evento `cron.purge_completed` com `failedSteps` vazio nos logs do Worker.
2. Diretoria e encarregado validam os prazos e preenchem os campos da política.
