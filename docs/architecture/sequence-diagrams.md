# Diagramas de Sequência Canónicos

Esta seção detalha os principais fluxos operacionais e transacionais do sistema utilizando diagramas de sequência Mermaid.

---

## 1. Fluxo de Submissão de Triagem Confidencial

Este fluxo descreve como um assistido envia o formulário confidencial de triagem até a persistência segura no Supabase e a notificação pastoral.

```mermaid
sequenceDiagram
    autonumber
    actor User as Assistido
    participant Browser as Navegador (React Form)
    participant Turnstile as Cloudflare Turnstile
    participant Supabase as Supabase (PostgreSQL)
    actor Pastor as Conselheiro Pastoral

    User->>Browser: Preenche dados e relatos de sofrimento
    User->>Browser: Aceita o Termo de Consentimento Pastoral (LGPD)
    Browser->>Turnstile: Solicita validação de integridade humana
    Turnstile-->>Browser: Retorna token Turnstile válido
    
    Browser->>Browser: Executa validação de esquema estrito (Zod)
    
    Browser->>Supabase: POST /rest/v1/triagens (com Anon Key)
    Note over Supabase: Valida política RLS: INSERT TO anon WITH CHECK (true)
    Supabase->>Supabase: Insere registro com status='pendente'
    Supabase-->>Browser: 201 Created (ID retornado)
    
    Browser->>User: Exibe tela de confirmação e acolhimento
    
    Note over Pastor,Supabase: Conselheiro autentica-se com 2FA no Supabase
    Pastor->>Supabase: Acessa Table Editor na tabela 'triagens'
    Pastor->>Supabase: Atualiza status para 'em_atendimento' e insere notas pastorais
```

---

## 2. Fluxo de Criação e Confirmação de Doação PIX

Este fluxo ilustra a geração do código PIX Copia-e-Cola e a conciliação assíncrona com tratamento de idempotência via webhook.

```mermaid
sequenceDiagram
    autonumber
    actor Doador as Doador
    participant Web as Frontend Web (Astro)
    participant Worker as Backend Worker
    participant Asaas as Gateway Asaas (PIX)
    participant Supabase as Supabase (Postgres)

    Doador->>Web: Seleciona valor da doação e informa dados
    Web->>Worker: POST /api/donations/create-pix
    Worker->>Asaas: Cria cobrança PIX imediata
    Asaas-->>Worker: Retorna payload PIX (QR Code e Copia-e-Cola)
    Worker->>Supabase: Insere intenção em 'doacoes' com status='pendente'
    Worker-->>Web: Retorna código PIX para o doador
    Web->>Doador: Exibe QR Code e chave Copia-e-Cola
    
    Note over Doador,Asaas: Doador efetua o pagamento no aplicativo do seu banco
    
    Asaas->>Worker: POST /api/webhooks/payment (com assinatura HMAC)
    Worker->>Worker: Valida assinatura e verifica lock de idempotência
    Worker->>Supabase: UPDATE doacoes SET status='confirmado' WHERE provider_charge_id=...
    Worker-->>Asaas: 200 OK (Webhook processado)
```

---

## 3. Fluxo de Expurgo Automático LGPD (Retenção Máxima)

Conforme a Política de Retenção e o Artigo 11 da LGPD, registros de triagem arquivados ou pendentes que ultrapassam a janela de retenção de 180 dias são purgados permanentemente.

```mermaid
sequenceDiagram
    autonumber
    participant Cron as Cloudflare Cron Trigger (03:00 UTC)
    participant Worker as Backend Worker
    participant Supabase as Supabase Postgres

    Cron->>Worker: Dispara evento agendado (scheduled)
    Worker->>Supabase: Executa DELETE FROM triagens WHERE created_at < NOW() - INTERVAL '180 days' AND status IN ('concluido', 'arquivado')
    Supabase-->>Worker: Registros deletados com sucesso
    Worker->>Worker: Registra métrica de expurgo sem registrar PII no log
```
