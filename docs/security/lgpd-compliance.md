# Controles de Privacidade e Tratamento de Dados (LGPD)

Esta página registra **controles técnicos implementados** e o que ainda depende de decisão ou validação. **Não é parecer jurídico** e não declara conformidade integral com a Lei nº 13.709/2018: a adequação final cabe ao encarregado de dados (DPO) e à assessoria jurídica da organização. Baseline auditada: backend `ca9737f`, frontend `4a08dfc`.

---

## 1. Hipóteses legais

| Fluxo / dado | Categoria | Hipótese legal |
| :--- | :--- | :--- |
| Triagem pastoral | Dado sensível potencial (religião, vida sexual, saúde) | **Pendente de validação** pelo encarregado e pela assessoria jurídica. O sistema coleta consentimento (`consent: true`, versão da política, data e rota em `triage_consents`) |
| Formulário de contato | Dados pessoais | **Pendente de validação.** Consentimento registrado em `contact_consents` |
| Newsletter | E-mail | **Pendente de validação.** Consentimento com confirmação dupla; `policy_version` e `consented_at` gravados |
| Doação por PIX dinâmico (se ativado) | Valor, frequência, e-mail opcional | **Pendente de validação** (incluindo obrigações fiscais e contábeis) |
| Doação pela chave PIX do CNPJ (padrão) | Nenhum dado passa pelo sistema | Comprovante, se enviado, segue pelo WhatsApp, fora do banco |

!!! warning "Referência removida"
    Versões anteriores citavam o Art. 11, II, "d" como base para "atividades de entidades sem fins lucrativos de caráter religioso". Essa associação não está comprovada e foi removida; a hipótese aplicável deve ser definida pelo encarregado e pelo jurídico.

## 2. Controles técnicos implementados

| Princípio | Controle | Evidência |
|---|---|---|
| Minimização | Relato é opcional; notificações à equipe carregam só o código de referência | [`submit-triage.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/application/usecases/submit-triage.ts), `tests/canary.test.ts` |
| Segurança | AES-256-GCM com AAD; RLS sem políticas; `REVOKE` de `anon`/`authenticated`; logs com scrubber | [Criptografia](crypto-architecture.md), [Hardening](../operations/database-hardening.md), [Observabilidade](../operations/observability.md) |
| Prova de consentimento | Versão da política, data e rota | `*_consents`, `newsletter_subscriptions.policy_version/consented_at` |
| Controle de acesso | Leitura pastoral exige `--reason` (mín. 5 caracteres) e grava `audit_events` | [`pastoral-inbox.mjs`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/scripts/pastoral-inbox.mjs) |
| Retenção | Expurgo diário de triagens e contatos (ver §3) | [`purge-repository.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/db/purge-repository.ts) |

## 3. Retenção: comportamento atual por tabela

| Tabela | Dados pessoais | Prazo / mecanismo implementado | Situação |
|---|---|---|---|
| `triage_submissions` | Contato e relato cifrados, código, programa, canal | `retention_until` = envio + **180 dias**; cron diário `0 3 * * *` (03:00 UTC, 00:00 em Brasília) nulifica código, programa, canal, ciphertexts, IVs e versão e marca `purged`. Independe do status. `created_month` permanece | Implementado |
| `contact_submissions` | Contato e mensagem cifrados, código | Idem, 180 dias. `subject` fica em claro e **não é nulificado** pelo expurgo | Implementado (ver limitação do assunto) |
| `triage_consents`, `contact_consents` | Sem PII direta (finalidade, versão, rota, datas) | **Não são removidos** no expurgo; `revoked_at` existe mas nenhum código o preenche | Decisão pendente |
| `newsletter_subscriptions` | E-mail cifrado + HMAC | **Sem prazo e sem rota de descadastro.** O status `unsubscribed` existe no CHECK e é tratado na reinscrição, mas nada o grava | **Limitação conhecida / decisão pendente** |
| `donation_intents` | `donor_email_hash`, `donor_email_cipher` (opcionais) | **Sem expurgo** | **Limitação conhecida / decisão pendente** |
| `payment_charges` | Sem PII; payload PIX | **Sem expurgo** (obrigações contábeis a definir pela organização) | Decisão pendente |
| `payment_webhook_events` | Sem PII (IDs do provedor) | **Sem expurgo** | **Limitação conhecida / decisão pendente** |
| `audit_events` | Operador (e-mail em `actor`), motivo, IDs | **Sem expurgo**; `ip_hash` existe mas não é preenchido | **Limitação conhecida / decisão pendente** |

Nenhum prazo adicional foi definido ou implementado nesta documentação.

### Detalhes do expurgo

| Aspecto | Valor (código) |
|---|---|
| Agendamento | `crons = ["0 3 * * *"]` em [`wrangler.toml`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/wrangler.toml) |
| Lote | `LIMIT 500` por tipo e por execução ([`purge-triage.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/application/usecases/purge-triage.ts), [`purge-contacts.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/application/usecases/purge-contacts.ts)) |
| Critério | `retention_until < agora` e `purged_at IS NULL` |
| Ordem | Triagens primeiro, depois contatos, na mesma execução |
| Garantia no banco | CHECK `triage_purged_clean` e `contact_purged_clean` |
| Logs | `cron.purge_completed` (só contagens), `cron.purge_failed`, `cron.purge_skipped` |
| Falha parcial | Uma exceção no expurgo de triagens interrompe a execução **antes** dos contatos; a próxima execução reprocessa. Não há alerta configurado além do log |

## 4. Direitos do titular

O titular pode pedir acesso, correção ou eliminação pelo e-mail institucional informado na Política de Privacidade do site. **Não existe procedimento automatizado**: eliminação de newsletter e de intenções de doação exige intervenção manual no banco, ainda não documentada nem testada. O fluxo oficial deve ser definido pelo encarregado.

## 5. Operadores e localização

| Operador | Função | Dados tratados |
|---|---|---|
| Neon (região `aws-sa-east-1`, conforme ADR-008) | PostgreSQL | Registros cifrados, hashes, auditoria |
| Cloudflare | Pages, Workers, Hyperdrive, Turnstile | Dados em trânsito; não verificado o que a plataforma retém |
| Resend | E-mail transacional | Endereço do destinatário (confirmação de newsletter); avisos à equipe só com código |
| Asaas / Mercado Pago (se ativado) | Gateway PIX | Valor; no Mercado Pago, o e-mail do doador ou o e-mail institucional de reserva |

Contratos, localização efetiva e transferência internacional são **dependentes de configuração e análise externas**.

## 6. Dados do site antigo

Por decisão da diretoria, nenhum dado pessoal do WordPress foi importado ou é mantido (ver [Migração do Site Antigo](../operations/legacy-migration.md)).
