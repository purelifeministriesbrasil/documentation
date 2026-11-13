# Dependências, Segurança Contínua e Releases

!!! abstract "Resumo"
    Dependabot abre PRs semanais agrupados; CodeQL analisa o código a cada PR e toda semana; nada
    entra em `main` sem os checks obrigatórios. Publicação: site e documentação ao mesclar; API pelo
    workflow manual **Deploy API**.

## Automação por repositório

| Repositório | Dependabot | CodeQL | Publicação |
|---|---|---|---|
| `backend` | npm + GitHub Actions, semanal (segunda), minor/patch agrupados | `codeql.yml` (PR, push em `main`, semanal) | `deploy.yml` — manual, ambiente `production`, roda a verificação completa antes |
| `frontend` | npm + GitHub Actions, semanal, minor/patch agrupados | `codeql.yml` | job `deploy` do `ci.yml` a cada push em `main` |
| `documentation` | pip + GitHub Actions, semanal | — (sem código executável) | `deploy-pages.yml` a cada push em `main` |

## Como tratar um PR do Dependabot

1. Checks verdes e mudança **minor/patch** → mesclar.
2. Atualização **major** (vem em PR separado) → ler as notas de versão, testar localmente
   (`pnpm verify` no backend, `pnpm ci:verify` no frontend) e só então mesclar.
3. `zod` precisa ter **a mesma versão** no backend e no frontend (o `src/schemas/` é compartilhado):
   mescle as duas atualizações juntas.
4. Mudança de `packageManager` (pnpm): o verificador `verify-package-manager` exige versão exata e
   igual à usada pela CI.

## Alertas de segurança

- *Security → Code scanning*: resultados do CodeQL. Alerta **alto/crítico** → issue e correção antes do próximo deploy.
- *Security → Dependabot alerts*: vulnerabilidade conhecida em dependência → mesclar a correção com prioridade.
- *Secret scanning*: se um segredo for detectado, **revogue-o primeiro** no provedor e siga
  [Rotação de Chaves](../operations/key-rotation.md); apagar o commit não basta.

## Release e versionamento

| Item | Regra |
|---|---|
| Mensagens de commit | [Conventional Commits](https://www.conventionalcommits.org/pt-br/) (`feat:`, `fix:`, `docs:`, `ci:`, `build:`…) |
| Merge | Sempre por Pull Request, com checks verdes e revisão (`CODEOWNERS`) |
| Site e documentação | Cada merge em `main` é uma release; reversão = *revert* do PR ou rollback no painel |
| API | Release = execução do **Deploy API**; o id da versão anterior fica no log do workflow para `wrangler rollback` |
| Migrations | Nunca editar uma migration aplicada; criar `NNNN_nome.sql` nova; backup antes de aplicar |
