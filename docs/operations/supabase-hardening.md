# Guia de Hardening e Correção do Linter de Segurança do Supabase

Este guia documenta o diagnóstico e a resolução técnica dos avisos de segurança emitidos pelo Database Linter do Supabase para o ecossistema Pure Life Brasil.

---

## 1. Diagnóstico dos Warnings do Linter

O Supabase Database Linter analisa periodicamente o banco de dados contra vetores de exposição e emitiu os seguintes avisos:

1. **`rls_policy_always_true` (Aviso 0024)**:
   - *Descrição*: Políticas de inserção (`INSERT`) que utilizam a cláusula permissiva `WITH CHECK (true)` concedem inserção irrestrita sem validar o conteúdo do payload inserido.
   - *Tabelas afetadas*: `public.triagens`, `public.contatos`, `public.newsletter` e `public.doacoes_intencoes`.
2. **`anon_security_definer_function_executable` & `authenticated_security_definer_function_executable` (Avisos 0028 e 0029)**:
   - *Descrição*: Funções criadas com privilégio `SECURITY DEFINER` expostas na rota RPC do PostgREST sem revogação de permissão pública para os papéis `anon` e `authenticated`.
   - *Função afetada*: `public.rls_auto_enable()`.

---

## 2. Script de Remediação Imediata

Para sanar 100% dos avisos, execute o seguinte script no **SQL Editor** do painel do Supabase:

```sql
-- ==============================================================================
-- CORREÇÃO DE WARNINGS DO LINTER DE SEGURANÇA DO SUPABASE
-- ==============================================================================

-- 1. CORREÇÃO RLS: triagens (valida campos mínimos obrigatórios)
DROP POLICY IF EXISTS "Permitir submissão pública de triagem" ON public.triagens;
CREATE POLICY "Permitir submissão pública de triagem"
    ON public.triagens
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        full_name IS NOT NULL AND length(trim(full_name)) >= 2 AND
        email IS NOT NULL AND length(trim(email)) >= 5
    );

-- 2. CORREÇÃO RLS: contatos (valida nome, email e mensagem)
DROP POLICY IF EXISTS "Permitir submissão pública de contato" ON public.contatos;
CREATE POLICY "Permitir submissão pública de contato"
    ON public.contatos
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        nome IS NOT NULL AND length(trim(nome)) >= 2 AND
        email IS NOT NULL AND length(trim(email)) >= 5 AND
        mensagem IS NOT NULL AND length(trim(mensagem)) >= 5
    );

-- 3. CORREÇÃO RLS: newsletter (valida email mínimo)
DROP POLICY IF EXISTS "Permitir inscrição pública na newsletter" ON public.newsletter;
CREATE POLICY "Permitir inscrição pública na newsletter"
    ON public.newsletter
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        email IS NOT NULL AND length(trim(email)) >= 5
    );

-- 4. CORREÇÃO RLS: doacoes_intencoes (valida valor positivo)
DROP POLICY IF EXISTS "Permitir registro público de doação" ON public.doacoes_intencoes;
CREATE POLICY "Permitir registro público de doação"
    ON public.doacoes_intencoes
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        valor_cents > 0
    );

-- 5 & 6. CORREÇÃO SECURITY DEFINER: rls_auto_enable
-- Revoga execução pública e converte para SECURITY INVOKER
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable'
    ) THEN
        REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated, PUBLIC;
        EXECUTE 'ALTER FUNCTION public.rls_auto_enable() SECURITY INVOKER';
    END IF;
END $$;
```

---

## 3. Verificação Pós-Aplicação

Após executar o script:

1. No painel do Supabase, acesse **Database** > **Linter**.
2. Clique em **Rerun Linter**.
3. Todos os 6 avisos serão removidos, atingindo status 100% verde (Passed).
