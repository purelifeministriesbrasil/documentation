# Backup & Recuperação de Desastres (DR)

Este runbook define os procedimentos para garantir a continuidade operacional da plataforma de dados no Supabase e a restauração de serviços em caso de desastre.

---

## 1. Métricas Canónicas de Recuperação

- **RPO (Recovery Point Objective)**: $\le 24$ horas para backups automáticos diários do Supabase (ou $\le 1$ hora com Point-in-Time Recovery - PITR ativado).
- **RTO (Recovery Time Objective)**: $\le 1$ hora para restauração completa de instâncias e apontamento de DNS.

---

## 2. Rotinas de Backup no Supabase

O Supabase realiza backups diários automáticos do cluster PostgreSQL.

### Export Manual de Segurança
Para realizar um dump manual das tabelas antes de manutenções estruturais:

```bash
# Export do schema e dados via pg_dump
pg_dump -h db.[project-ref].supabase.co -U postgres -d postgres -F c -b -v -f "backup_purelife_$(date +%Y%m%d).dump"
```

---

## 3. Procedimento de Restauração (Rollback de Desastre)

1. Acesse o painel do Supabase: `Project Settings` > `Database` > `Backups`.
2. Selecione o ponto de restauração desejado na lista cronológica.
3. Clique em **Restore to this backup**.
4. Aguarde a conclusão do processo.
5. Verifique a integridade das tabelas `triagens`, `contatos` e `doacoes` executando:
   ```sql
   SELECT count(*) FROM public.triagens;
   SELECT count(*) FROM public.contatos;
   ```
