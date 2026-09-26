# ADR-002: Adoção do Supabase como Plataforma de Dados e Gestão Pastoral

- **Status**: Aprovado
- **Data**: 2026-09-25
- **Decisores**: Equipe de Engenharia Pure Life Ministries Brasil

---

## 1. Contexto e Motivação

Originalmente, o projeto planejava utilizar uma divisão entre **Sanity CMS** (para conteúdo editorial) e **Neon Postgres** (para triagens confidenciais). No entanto, essa arquitetura apresentou complexidade operacional excessiva para a equipe ministerial:

1. Dois painéis administrativos distintos para gerenciar.
2. Necessidade de esquemas de dados duplicados e sincronização via webhooks.
3. Conselheiros pastorais precisavam de uma interface simples para visualizar triagens, mudar status de atendimento e registrar anotações sem complexidade técnica.

---

## 2. Decisão

Adotar o **Supabase** como a plataforma central de banco de dados e gestão operacional do ecossistema:

1. **Banco PostgreSQL Gerenciado**: Hospedagem robusta, compatível com SQL padrão, backups e replicação.
2. **Row Level Security (RLS)**: Aplicação de políticas que permitem inserções anônimas diretas do frontend web (`INSERT TO anon WITH CHECK (true)`), enquanto impedem qualquer tipo de leitura pública (`SELECT`) de registros de terceiros.
3. **Table Editor Visual**: Os conselheiros e administradores pastorais utilizam a interface web intuitiva do Supabase para acompanhar as triagens, atualizar status e adicionar notas com controle de acesso baseado em papéis e 2FA.

---

## 3. Alternativas Rejeitadas

- **Sanity Studio v3 + Neon Serverless**: Rejeitado pela complexidade de manutenção de dois serviços terceiros independentes e curva de aprendizado desnecessária para a equipe não técnica.
- **Firebase / Firestore**: Rejeitado por ser NoSQL proprietário, dificultando consultas relacionais e relatórios pastorais complexos, além de menor conformidade com privacidade relacional e DPA para a LGPD.
- **Postgres Auto-Hospedado (VPS)**: Rejeitado pelo ônus operacional contínuo de segurança, patching do SO, gerenciamento de firewall e rotinas manuais de backup.

---

## 4. Consequências

### Impactos Positivos:
- **Simplicidade Radical**: Um único serviço cobre banco de dados relacional e painel administrativo visual.
- **Desacoplamento Seguro**: O frontend insere dados diretamente no Supabase via REST PostgREST usando apenas a chave pública `anon`, eliminando a necessidade de intermediar submissões simples por APIs complexas.
- **Segurança Nativa**: O Postgres RLS garante que a chave anônima não pode ler dados de outras pessoas sob nenhuma circunstância.

### Trade-offs:
- Dependência do ecossistema Supabase para a camada de persistência gerenciada (atenuada pelo fato de o Supabase ser construído sobre o PostgreSQL open-source padrão, permitindo migração para qualquer cluster Postgres se necessário).
