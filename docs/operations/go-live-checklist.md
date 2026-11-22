# Checklist de Go-live

Ordem obrigatória. Cada etapa de produção é uma operação **separada e identificável**, executada pelo
operador com a autorização correspondente. O script `go-live-final.sh` fica na pasta de trabalho que reúne
os três repositórios (fora deles); sem argumentos ele roda só `preflight`, que não altera nada.

!!! info "Situação em 21/11/2026"
    **No ar:** site, `www` → raiz, API em `api.`, e-mails com a identidade visual, limite de abuso no Worker e na
    borda, proteção de branches. Contato, triagem e newsletter testados no domínio oficial; `verify` com 7/7
    PASS; migration `0003` aplicada; registros de teste apagados. **Pendente:** Política de Privacidade e
    decisões de retenção (pastor/jurídico), transferência do registro do domínio, desligamento do legado.
    Health check **não** equivale a teste ponta a ponta.

## 1. Pré-condições (não técnicas)

- [ ] Política de Privacidade preenchida e aprovada (frontend#14 sem `[PREENCHER`; ver
      [Inventário de Retenção](../security/data-retention.md)).
- [x] Decisões de retenção R-RET-1, 3, 4 e 5 adotadas e implementadas em 21/11/2026 (R-RET-2 só se o gateway for ligado). **Falta aplicar a migration `0004` e publicar a API** ([como](../security/data-retention.md#colocar-em-vigor)).
- [x] `RATE_LIMIT_MODE = "enforce"` (bloqueio de abuso ativo desde 14/11/2026).
- [x] [Proteção de branches](branch-protection.md) aplicada (13/11/2026).
- [x] Registrador: nameservers da Cloudflare ativos (21/11/2026); DNSSEC desligado durante a troca.

## 2. Validação local

```bash
./go-live-final.sh preflight
./go-live-final.sh validate
```

`validate` executa, em cada repositório, os mesmos verificadores dos workflows: versão do pnpm
(`verify-package-manager --runtime`), sincronização de `src/schemas` nos dois sentidos, `pnpm verify`
(backend, com PostgreSQL descartável), `pnpm ci:verify` (frontend, com as quatro variáveis `PUBLIC_*` de
teste definidas explicitamente — nunca o `.env` local), `mkdocs build --strict`, `db:migrate:dry-run` e
`wrangler deploy --dry-run`.

## 3. Merges (um PR por vez)

- [x] backend#16 e frontend#15 juntos (o `schema-sync` falha em `main` se só um entrar) — mesclados.
- [x] documentation (sincronização) — mesclado; esta página e as demais foram atualizadas em 21/11/2026.
- [ ] frontend#14 só depois da política aprovada; antes, trazer `main` por merge commit.

```bash
./go-live-final.sh production merge <repo> <número-do-PR> <sha-do-head>
```

Exige a autorização `PLM_ALLOW_MAIN_MERGE`, que só o operador define no próprio ambiente. O script recusa PR em rascunho, check não aprovado e head diferente do SHA informado. Lembre: o merge no
`frontend` publica o site.

## 4. Backup → migration → deploy

```bash
./go-live-final.sh production backup      # exige PLM_ALLOW_PROD_MIGRATION, PLM_BACKUP_DIR, PLM_BACKUP_GPG_RECIPIENT
./go-live-final.sh production migrate     # exige PLM_ALLOW_PROD_MIGRATION e backup verificado < 60 min
./go-live-final.sh production deploy-api  # exige PLM_ALLOW_BACKEND_DEPLOY
```

- O backup usa a conexão **direta** do Neon (sem `-pooler`), lida de `PLM_PROD_DIRECT_DATABASE_URL` e
  repassada ao `pg_dump` só por variáveis `PG*` do processo filho — nunca em argumento de linha de comando.
- O dump é validado com `pg_restore --list`, cifrado com GPG para o destinatário informado, gravado fora
  dos repositórios com permissão restrita; o arquivo em claro é removido e um manifesto registra os SHA-256.
- Estado em produção: `0001`–`0003` aplicadas (a `0003` em 21/11/2026, com backup antes).

## 5. Verificação

```bash
PLM_API_BASE=https://api.purelifeministriesbrasil.org PLM_SITE_BASE=https://purelifeministriesbrasil.org ./go-live-final.sh verify
```

Sem alterar registros: `/health` 200; confirmação da newsletter com token malformado → **400**; com token
válido e inexistente → **410**; cabeçalhos CSP, HSTS e `X-Frame-Options`; `/triagem/` com `no-store`.
Testes de fumaça manuais (envio real de formulário, leitura pastoral) seguem o
[runbook de implantação](deployment.md).

## 6. Reversão

```bash
./go-live-final.sh rollback
```

Mostra e valida o procedimento (rollback do Worker, do Pages, restauração do backup); não executa nada.

## 7. Depois do go-live

- [ ] Transferir o registro do domínio para a Cloudflare (código de autorização na Locaweb; DNSSEC depois).
- [ ] Desligar o WordPress/OVH, remover a conta Cloudflare antiga e rotacionar credenciais
      ([passo 12](deployment.md#12-desativacao-do-legado)).
- [ ] Migration `0004` aplicada e API publicada (retenção em vigor); Política de Privacidade publicada (item 1).
- [ ] Conferir o site em celulares reais (a auditoria automática em 12 resoluções já passou; ver
      [Testes e CI/CD](../quality/testing-and-cicd.md)).
