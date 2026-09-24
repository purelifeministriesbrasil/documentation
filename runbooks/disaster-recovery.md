# Runbook: Recuperação de Desastres (Disaster Recovery) e Métricas RPO/RTO

Procedimento de contingência e restauração para o banco Neon Postgres e serviços da Pure Life Brasil conforme §12.1.

## 1. Métricas de Resiliência Alvo

| Componente | RPO (Objetivo de Ponto de Recuperação) | RTO (Objetivo de Tempo de Recuperação) | Estratégia de Backup | Responsável |
|---|---|---|---|---|
| **Triagem & Consentimento (Neon)** | 1 hora | 1 hora | Continuous WAL archiving + Point-in-time Restore no Neon | Tech Lead + DPO |
| **Chaves de Cifra** | 0 (perda zero) | 1 hora | Cofre seguro offline com 2 operadores nomeados | Tech Lead + Diretoria |
| **Regras Cloudflare (WAF/Headers)** | 0 (perda zero) | 1 hora | Código declarativo Terraform em Git (`purelife-infra`) | Tech Lead |
| **Conteúdo Editorial (Sanity)** | 24 horas | 8 horas | Dataset export semanal versionado | Equipe Editorial |

---

## 2. Procedimento de Restauração do Banco Neon (Point-in-Time Recovery)

Em caso de corrupção acidental ou deleção indevida de dados na base principal:

### Passo 1: Isolar o Tráfego de Produção
Coloque a rota de formulário em manutenção na Cloudflare via WAF para evitar novas submissões concorrentes:

```bash
# Ou via painel da Cloudflare ou acionando a regra no Terraform
```

### Passo 2: Executar o Restore no Neon
1. Acesse o console do Neon (`console.neon.tech`).
2. Selecione o projeto `purelife-production` e acesse a aba **Branches**.
3. Crie uma nova branch a partir de um ponto no tempo (*Point in Time*) anterior ao incidente:
   - Defina o timestamp exato do restore.
   - Nomeie a branch como `recovery-YYYYMMDD-HHMM`.

### Passo 3: Validação da Integridade e Chaves
1. Conecte à nova branch e execute a verificação das constraints `CHECK`:
   ```sql
   SELECT count(*) FROM triage_submissions WHERE status = 'purged' AND (contact_ciphertext IS NOT NULL OR reference_code IS NOT NULL);
   -- O resultado DEVE ser 0.
   ```
2. Realize uma decifração teste com a chave ativa vigente para certificar que o AAD corresponde ao estado restaurado.

### Passo 4: Promover a Branch para Produção
1. No console do Neon, promova a branch recuperada para `main` (ou atualize o secret `DATABASE_URL` no Cloudflare Worker apontando para o endpoint da nova branch).
2. Execute os testes automatizados de ponta a ponta (`pnpm test` no backend).
3. Reative o tráfego normal na borda Cloudflare.
