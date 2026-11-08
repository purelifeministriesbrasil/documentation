# Backup & Recuperação de Desastres (DR)

Este runbook define os procedimentos para garantir a continuidade operacional do banco no **Neon** e a
restauração de serviços em caso de desastre.

---

## 1. Metas de Recuperação

!!! warning "Objetivos internos, não verificados"
    Os valores abaixo são **objetivos de planejamento**. Nada no código ou na configuração dos repositórios os comprova, e não há registro de teste de restauração. Confirme no painel do Neon qual é a janela de restauração do plano em uso antes de depender dela.

| Objetivo | Valor proposto | Situação |
|---|---|---|
| RPO | Até 7 dias, **se** a exportação manual semanal (seção 3) for de fato executada; dentro da janela do plano, o histórico do Neon pode ser mais fino | Não verificado; depende de execução humana e do plano do Neon |
| RTO | 1 hora para restaurar o banco e reapontar o Hyperdrive | Nunca medido; sem simulação registrada |

A janela de histórico do plano gratuito do Neon **não foi confirmada** em fonte oficial nesta auditoria. Consulte *Settings → Instant restore / History retention* no painel.

!!! note "Retenção e backups"
    Dumps e pontos de restauração podem conter registros que o expurgo diário já removeu do banco ativo. A política de retenção desses arquivos é uma decisão pendente (ver [Controles de Privacidade](../security/lgpd-compliance.md#3-retencao-comportamento-atual-por-tabela)).

---

## 2. O que precisa de backup

| Item | Onde fica | Como proteger |
|---|---|---|
| Banco (tabelas, ciphertexts, auditoria) | Neon | Histórico do plano + `pg_dump` semanal |
| `TRIAGE_KEY_V1` (e versões seguintes) e `HASH_PEPPER` | Cofre da organização | Sem elas o backup do banco é ilegível; nunca guarde no mesmo lugar do dump |
| Segredos da API | Cloudflare (`wrangler secret`) + cofre | Recriáveis a partir do cofre |
| Código e conteúdo do site | GitHub | Os repositórios são a fonte de verdade |

---

## 3. Exportação manual (semanal e antes de manutenções)

Use a conexão **direta** do Neon (sem `-pooler`) e um `pg_dump` da mesma versão principal do servidor (consulte-a no painel do Neon; a CI do backend usa PostgreSQL 17):

```bash
pg_dump "postgresql://<usuario>:<senha>@ep-<endpoint>.c-2.sa-east-1.aws.neon.tech/neondb?sslmode=require" \
  -F c -b -v -f "backup_purelife_$(date +%Y%m%d).dump"
```

O arquivo contém apenas **ciphertext** nos campos sensíveis, mas ainda assim é dado pessoal: guarde-o em
armazenamento institucional com acesso restrito e apague cópias antigas conforme a política de retenção (ainda não definida).

---

## 4. Restauração

=== "Pelo histórico do Neon"

    1. No painel do Neon, abra o projeto e vá em *Restore* (ou *Branches → Restore*).
    2. Escolha o ponto no tempo anterior ao incidente e restaure na branch principal (o Neon preserva o estado
       anterior numa branch de backup).
    3. A string de conexão não muda; o Hyperdrive continua válido.

=== "A partir de um dump"

    1. Crie um banco vazio (ou um projeto novo na região São Paulo).
    2. Restaure: `pg_restore -d "<conexão direta>" --no-owner -v backup_purelife_AAAAMMDD.dump`.
    3. Se a conexão mudou, atualize o Hyperdrive (`wrangler hyperdrive update <id> --connection-string=…`)
       e o segredo `DATABASE_URL`.

**Verificação** (em qualquer caso):

```sql
SELECT filename, applied_at FROM public.schema_migrations ORDER BY filename;
SELECT count(*) FROM public.triage_submissions;
SELECT count(*) FROM public.contact_submissions;
SELECT status, count(*) FROM public.payment_charges GROUP BY status;
```

Depois, rode `pnpm db:migrate:dry-run` no `backend` para confirmar que nenhuma migration ficou pendente e faça
um teste de leitura pela caixa pastoral.

---

## 5. Teste de restauração (simulado, sem tocar produção)

Faça **antes da entrega** e depois a cada trimestre ou mudança de provedor. O objetivo é medir o RTO real e provar que o dump é legível com as chaves guardadas no cofre.

**Pré-requisitos:** um `pg_dump` recente (seção 3), acesso ao cofre com `TRIAGE_KEY_V1` e `HASH_PEPPER`, e um destino **descartável** (branch nova do Neon ou PostgreSQL local). Nunca restaure sobre o banco de produção.

1. **Anote a hora de início** (para medir o RTO).
2. **Crie o destino descartável.** No Neon: *Branches → Create branch* a partir do ponto atual, com nome `teste-restauracao-AAAAMMDD`; copie a conexão **direta** desse branch. Local: `createdb purelife_restore_test`.
3. **Restaure o dump** no destino: `pg_restore -d "<conexão do destino>" --no-owner -v backup_purelife_AAAAMMDD.dump`. Esperado: termina sem erros fatais (avisos de ownership são normais).
4. **Confira as migrations:** `SELECT filename FROM public.schema_migrations ORDER BY filename;`. Esperado: `0001`, `0002` e `0003` (esta, depois de aplicada em produção).
5. **Confira contagens** (as da seção 4) e compare com a produção na mesma hora (podem diferir por novos envios).
6. **Prove que o dado é legível com as chaves do cofre.** No `backend`, defina no shell (sem gravar em arquivo) `DATABASE_URL` do **destino de teste**, `TRIAGE_KEY_V1` (do cofre) e `OPERATOR` (seu e-mail). Rode `node scripts/pastoral-inbox.mjs list`, escolha **um** código e rode `node scripts/pastoral-inbox.mjs show <CÓDIGO> --reason "teste de restauração"`. Esperado: os campos aparecem em texto legível. Erro de descriptografia significa que a chave do cofre não corresponde ao dump: trate como falha do teste.
7. **Descarte o destino** (apagar o branch do Neon ou `dropdb`) e apague o dump de teste conforme a política de retenção.
8. **Registre** no quadro abaixo.

| Data | Quem | Dump usado | Tempo total (RTO medido) | Resultado | Observações |
|---|---|---|---|---|---|
| (a preencher no primeiro teste) | | | | | |

Se o tempo medido passar de 1 hora, ajuste a meta da seção 1 ou o processo. O resultado do teste é que valida (ou derruba) o RTO/RPO declarado; até lá ele continua "não verificado".

