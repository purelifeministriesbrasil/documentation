# Configuração do Banco de Dados no Supabase

O **Supabase** é a plataforma de dados central do ecossistema, fornecendo um banco de dados relacional PostgreSQL totalmente gerenciado, com segurança no nível de linha (RLS) e uma interface visual (*Table Editor*) para que a equipe pastoral possa acompanhar os atendimentos com facilidade.

---

## 1. Criação do Projeto no Supabase

1. Crie uma conta gratuita ou faça login em [supabase.com](https://supabase.com).
2. Clique em **New Project**.
3. Defina:
   - **Name**: `purelife-brasil`
   - **Database Password**: Escolha uma senha segura e guarde-a com segurança.
   - **Region**: Selecione `São Paulo (sa-east-1)` para menor latência no Brasil.
4. Aguarde cerca de 2 minutos até o provisionamento do cluster Postgres.

---

## 2. Aplicação do Esquema de Banco de Dados (`schema.sql`)

1. No painel do Supabase, clique no menu lateral em **SQL Editor**.
2. Clique em **+ New query**.
3. Copie o script SQL oficial localizado em `frontend/supabase/schema.sql` e cole no editor:

```sql
-- Habilita extensão pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Tabela de Triagens Confidenciais (LGPD Art. 11)
CREATE TABLE IF NOT EXISTS public.triagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    birthdate DATE NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('masculino', 'feminino')),
    marital_status TEXT NOT NULL,
    city TEXT NOT NULL,
    state VARCHAR(2) NOT NULL,
    urgency TEXT NOT NULL DEFAULT 'media' CHECK (urgency IN ('baixa', 'media', 'alta', 'critica')),
    struggles TEXT[] NOT NULL DEFAULT '{}',
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_atendimento', 'concluido', 'arquivado')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabela de Mensagens de Contato
CREATE TABLE IF NOT EXISTS public.contatos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'respondido', 'arquivado'))
);

-- 3. Tabela de Inscrições de Newsletter
CREATE TABLE IF NOT EXISTS public.newsletters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    active BOOLEAN NOT NULL DEFAULT true
);

-- 4. Tabela de Doações e Intenções PIX
CREATE TABLE IF NOT EXISTS public.doacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount_cents INTEGER NOT NULL,
    donor_name TEXT NOT NULL,
    donor_email TEXT NOT NULL,
    donor_cpf TEXT,
    category TEXT NOT NULL DEFAULT 'geral',
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'cancelado')),
    provider_charge_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ativa Row Level Security (RLS)
ALTER TABLE public.triagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doacoes ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS: Apenas inserções públicas anônimas (Zero Leitura Externa)
CREATE POLICY "Permitir insercao anonima de triagens" ON public.triagens FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir insercao anonima de contatos" ON public.contatos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir insercao anonima de newsletters" ON public.newsletters FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir insercao anonima de doacoes" ON public.doacoes FOR INSERT TO anon WITH CHECK (true);
```

4. Clique no botão verde **Run**. O resultado exibirá: `Success. No rows returned`.

---

## 3. Gestão Pastoral pelo Table Editor

Após a execução do script:

1. No menu lateral do Supabase, clique em **Table Editor**.
2. Você verá as tabelas:
   - `triagens`: Registro de pedidos de ajuda pastoral.
   - `contatos`: Mensagens gerais enviadas pelos visitantes.
   - `doacoes`: Histórico de intenções de doação.
   - `newsletters`: Lista de e-mails inscritos para informativos.
3. Para alterar o status de um atendimento (ex: de `pendente` para `em_atendimento`), basta dar duplo clique na célula e selecionar o novo valor.
