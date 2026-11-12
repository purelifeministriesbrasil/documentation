# Resposta a Incidentes (técnico)

!!! warning "Escopo"
    Este runbook cobre só a parte técnica: conter, preservar evidências e restaurar. A **comunicação à ANPD e
    aos titulares** (LGPD, art. 48), os prazos e quem decide são **pendências institucionais** — o
    procedimento ainda não foi definido pelo ministério nem validado pelo encarregado (ver o campo
    correspondente na Política de Privacidade, frontend#14).

## 1. Classificar

| Situação | Exemplos | Gravidade |
|---|---|---|
| Vazamento ou suspeita de vazamento de chave | `TRIAGE_KEY_Vn`, `HASH_PEPPER`, `DATABASE_URL`, token Cloudflare/Resend/gateway exposto | Crítica |
| Acesso indevido a dados | Leitura não justificada em `audit_events`, credencial de operador comprometida | Crítica |
| Indisponibilidade | `/health` falhando, 5xx contínuos, banco inacessível | Alta |
| Abuso | Picos de `rate_limit.would_block`, spam nos formulários | Média |

## 2. Conter

- **Chave ou credencial exposta:** revogar/rotacionar imediatamente no provedor e seguir
  [Rotação de Chaves](key-rotation.md). Nunca colar o valor em chat, issue ou commit.
- **Abuso:** com o operador, trocar `RATE_LIMIT_MODE` para `"enforce"` em `backend/wrangler.toml` e
  implantar; regra de WAF na zona, se necessário. Lembre que em `"log"` nada é bloqueado.
- **Comprometimento do Worker:** `pnpm exec wrangler rollback <deployment-id>` para a última versão íntegra
  (`pnpm exec wrangler deployments list`).
- **Gateway de pagamento:** desativar o webhook no painel do provedor e manter `PUBLIC_ENABLE_PIX_GATEWAY=false`.

## 3. Preservar evidências

- Exportar os logs do período (Workers Logs) sem reencaminhá-los a terceiros; eles não contêm PII por
  desenho (scrubber), mas tratá-los como confidenciais.
- Consultar `audit_events` (somente leitura) para acessos pastorais no período.
- Registrar linha do tempo: detecção, contenção, ações, pessoas envolvidas.

## 4. Restaurar

- Banco: [Backup & Recuperação](backup-recovery.md) (restauração para um banco novo, conferência de contagens
  e de `schema_migrations`).
- Site: "Rollback to this deployment" no painel do Cloudflare Pages.

## 5. Encerrar

- Revisão pós-incidente com causa raiz e ações preventivas.
- Atualizar o [Modelo de Ameaças](../security/threat-model.md) quando a causa revelar um risco novo.
