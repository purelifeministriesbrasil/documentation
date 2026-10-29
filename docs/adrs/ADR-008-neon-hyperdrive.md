# ADR-008 — Banco no Neon Postgres com Cloudflare Hyperdrive

- **Status**: Aprovado (substitui o [ADR-002](ADR-002-supabase-plataforma-dados.md))
- **Data**: 2026-10-28
- **Decisores**: Equipe de Engenharia e liderança da Pure Life Ministries Brasil

---

## 1. Contexto

O banco foi criado no Supabase (plano gratuito) em 15/10/2026. Como a API ainda não estava publicada, o projeto
ficou sem atividade e o Supabase o **pausou** depois de cerca de 7 dias. Um projeto pausado só volta com
reativação manual no painel; enquanto isso, todos os formulários do site falhariam. O expurgo diário (cron
`0 3 * * *`) não evita a pausa de forma garantida, e o plano pago (US$ 25/mês) seria a única proteção certa.

Ao mesmo tempo, o sistema usa **apenas o PostgreSQL**: a Data API, o Auth e o Storage do Supabase não são
usados, e a migration `0002` até revoga o acesso das roles públicas. A gestão pastoral é feita pela CLI auditada,
não pelo painel do banco.

## 2. Decisão

1. Usar o **Neon Postgres** (plano gratuito) na região **AWS São Paulo (`aws-sa-east-1`)**, com as mesmas
   migrations de `backend/drizzle/`, sem alteração.
2. Conectar a API ao banco pelo **Cloudflare Hyperdrive** (configuração `purelife-db`, binding `HYPERDRIVE`),
   criado com a conexão **direta** do Neon. O segredo `DATABASE_URL` (conexão com pooling do Neon) permanece
   como reserva: `readDatabaseUrl` usa o Hyperdrive quando o binding existe.
3. Migrations e caixa pastoral usam a conexão direta, definida em `backend/.env` (fora do git).
4. Remover o parâmetro `channel_binding=require` das URLs, que o driver `postgres.js` não suporta.

## 3. Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Supabase Pro (US$ 25/mês) | Custo recorrente para recursos que o sistema não usa |
| Manter o Supabase gratuito com “ping” agendado | Frágil: depende de uma heurística de atividade da plataforma e não impede a pausa com certeza |
| Cloudflare D1 (SQLite) | Exigiria reescrever schema, migrations, repositórios e testes de integração |
| Neon sem Hyperdrive | Funciona, mas cada requisição abriria uma conexão TLS nova até São Paulo |

## 4. Consequências

**Benefícios**

- O banco **nunca fica indisponível por inatividade**: o Neon desliga o processamento após alguns minutos sem
  uso e o religa automaticamente na próxima conexão.
- O Hyperdrive mantém conexões abertas na borda: em teste, uma consulta completa pela API levou cerca de 0,33 s.
- Nenhuma mudança de código além da documentação, dos templates de ambiente e do binding no `wrangler.toml`.

**Trade-offs**

- A **primeira** requisição depois de um período ocioso leva cerca de meio segundo a mais (o banco acordando).
- O plano gratuito do Neon tem limites de armazenamento e de janela de restauração; acompanhe o uso no painel e
  reavalie o plano quando o volume crescer ([Backup & Recuperação](../operations/backup-recovery.md)).
- O nome da migration `0002_supabase_hardening_and_rls.sql` é histórico e foi mantido, porque o runner registra
  o checksum de cada arquivo aplicado.
