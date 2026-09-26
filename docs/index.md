---
title: 'Pure Life Ministries Brasil — Documentação Técnica'
hide:
  - navigation
  - toc
---

<div class="docs-hero">
  <div class="docs-hero-badge">
    ARQUITETURA CANÔNICA
  </div>
  
  <h1 class="docs-hero-title">
    Pure Life Ministries Brasil<br>
    <span>Engenharia de Software &amp; Governança</span>
  </h1>
  
  <p class="docs-hero-subtitle">
    Portal corporativo de especificações técnicas, decisões arquiteturais, governança de segurança da informação
    e conformidade irrestrita com a LGPD (Art. 11 &mdash; Dados Sensíveis). O ecossistema digital foi concebido para sustentar
    quatro décadas de aconselhamento bíblico sob estrito sigilo pastoral e alta disponibilidade na borda.
  </p>

  <div class="docs-hero-actions">
    <a href="architecture/system-overview/" class="md-button md-button--primary">Visão Geral da Arquitetura</a>
    <a href="architecture/repositories-scope/" class="md-button">Fronteiras dos Repositórios</a>
    <a href="security/threat-model/" class="md-button">Segurança &amp; LGPD</a>
    <a href="operations/deployment/" class="md-button">Runbooks Operacionais</a>
  </div>
</div>

---

## Acesso Direto aos Recursos Técnicos

<div class="four-columns-grid">
  <div class="four-card">
    <div>
      <div class="four-card-header">
        <svg class="tech-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
        <span>Decisões de Arquitetura</span>
      </div>
      <p class="four-card-desc">
        Registros formais (ADRs 001 a 005) com a fundamentação de escolhas tecnológicas, alternativas e trade-offs.
      </p>
    </div>
    <a href="adrs/index.md" class="four-card-link">
      Consultar ADRs &rarr;
    </a>
  </div>

  <div class="four-card">
    <div>
      <div class="four-card-header">
        <svg class="tech-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
        <span>Segurança &amp; LGPD</span>
      </div>
      <p class="four-card-desc">
        Modelagem STRIDE, conformidade com o Artigo 11 para dados sensíveis e governança de chaves AES-256-GCM.
      </p>
    </div>
    <a href="security/threat-model/" class="four-card-link">
      Acessar Segurança &rarr;
    </a>
  </div>

  <div class="four-card">
    <div>
      <div class="four-card-header">
        <svg class="tech-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
        <span>Contratos &amp; Schemas</span>
      </div>
      <p class="four-card-desc">
        Esquemas canônicos Zod/TypeScript para triagens, contatos, intenções de doação PIX e newsletters.
      </p>
    </div>
    <a href="schemas/triage-schema/" class="four-card-link">
      Ver Contratos &rarr;
    </a>
  </div>

  <div class="four-card">
    <div>
      <div class="four-card-header">
        <svg class="tech-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="14" x="2" y="3" rx="2"></rect><line x1="8" x2="16" y1="21" y2="21"></line><line x1="12" x2="12" y1="17" y2="21"></line></svg>
        <span>Operações &amp; Runbooks</span>
      </div>
      <p class="four-card-desc">
        Guias de deploy na Vercel, observabilidade de Golden Signals, comandos CLI e planos de contingência.
      </p>
    </div>
    <a href="operations/observability/" class="four-card-link">
      Ver Runbooks &rarr;
    </a>
  </div>
</div>

---

## Divisão Canônica em Três Repositórios

O ecossistema adota separação estrita de responsabilidades: **"Front com Front, Back com Back e Docs com Docs"**.

<div class="pillars-container">

<div class="pillar-card">
  <div>
    <div class="pillar-top">
      <span class="pillar-badge">repositório: frontend</span>
    </div>
    <h3 class="pillar-title">Interface Pública &amp; Borda</h3>
    <p class="pillar-desc">
      Apresentação institucional compilada em HTML estático e blindada contra injeção de código ou vazamento de segredos.
    </p>
    <ul class="pillar-list">
      <li>16 páginas estáticas pré-renderizadas com Astro 5 SSG</li>
      <li>Ilhas React isoladas exclusivamente para formulários interativos</li>
      <li>Tailwind CSS v4 com tokens tipográficos institucionais</li>
      <li>Zero credenciais privilegiadas (cliente público com chave anônima)</li>
      <li>Topologia 100% estática com verificação em CI/CD</li>
    </ul>
  </div>
  <div class="pillar-action">
    <a href="architecture/repositories-scope/#a-repositorio-frontend-front-com-front" class="md-button md-button--primary">
      Escopo Frontend &rarr;
    </a>
  </div>
</div>

<div class="pillar-card">
  <div>
    <div class="pillar-top">
      <span class="pillar-badge">repositório: backend</span>
    </div>
    <h3 class="pillar-title">Serviços &amp; Webhooks PIX</h3>
    <p class="pillar-desc">
      Microsserviços serverless na Cloudflare Workers para processamento financeiro assíncrono e rotinas de manutenção.
    </p>
    <ul class="pillar-list">
      <li>Proteção anti-bot Cloudflare Turnstile nativa</li>
      <li>Webhooks PIX idempotentes para Asaas e Mercado Pago</li>
      <li>Validação criptográfica de assinaturas HMAC-SHA256</li>
      <li>Lease atômico contra processamento concorrente de pagamentos</li>
      <li>Rotina diária de expurgo de dados sensíveis (180 dias)</li>
    </ul>
  </div>
  <div class="pillar-action">
    <a href="architecture/repositories-scope/#b-repositorio-backend-back-com-back" class="md-button md-button--primary">
      Escopo Backend &rarr;
    </a>
  </div>
</div>

<div class="pillar-card">
  <div>
    <div class="pillar-top">
      <span class="pillar-badge">repositório: documentation</span>
    </div>
    <h3 class="pillar-title">Governança &amp; Auditoria</h3>
    <p class="pillar-desc">
      Repositório central de engenharia contendo especificações canônicas, registros de decisões e manuais operacionais.
    </p>
    <ul class="pillar-list">
      <li>Portal MkDocs Material com validação estrita em pipeline</li>
      <li>Decisões de Arquitetura (ADRs 001 a 005) versionadas</li>
      <li>Especificação de Requisitos de Software (SRS)</li>
      <li>Modelagem de ameaças STRIDE e conformidade LGPD Art. 11</li>
      <li>Manuais de deploy, observabilidade e contingência</li>
    </ul>
  </div>
  <div class="pillar-action">
    <a href="architecture/repositories-scope/#c-repositorio-documentation-docs-com-docs" class="md-button md-button--primary">
      Escopo Docs &rarr;
    </a>
  </div>
</div>

</div>

---

## Topologia Geral da Arquitetura

```mermaid
graph TD
    Client["Navegador do Usuário / Dispositivo Móvel"]
    
    subgraph EdgeFrontend ["Repositório: frontend (Vercel Edge)"]
        AstroSSG["Astro 5 SSG (16 Páginas Estáticas)"]
        ReactIslands["Ilhas React (Formulários Triagem/Contato/Doação)"]
    end

    subgraph ServerlessBackend ["Repositório: backend (Cloudflare Workers)"]
        TurnstileGuard["Proteção Anti-Bot Turnstile"]
        PaymentWebhooks["Webhooks PIX Idempotentes (Asaas / MP)"]
        PurgeCron["Cron de Expurgo Diário (03:00 UTC)"]
    end

    subgraph DataPlatform ["Supabase PostgreSQL"]
        RLS["Row-Level Security (RLS)"]
        TriageVault["Tabela Triagens (Criptografia AES-256-GCM)"]
        ContactStore["Tabela Contatos (Tratamento Pastoral)"]
        DonationStore["Tabela Intenções PIX & Liquidação"]
    end

    subgraph GovernanceDocs ["Repositório: documentation (GitHub Pages)"]
        MkDocsPortal["Portal Técnico Canônico & ADRs"]
    end

    Client -->|HTTPS / Anycast| AstroSSG
    AstroSSG --> ReactIslands
    ReactIslands -->|Insert Seguro via RLS / Anon| RLS
    ReactIslands -->|Validação Anti-Bot| TurnstileGuard
    PaymentWebhooks -->|Notificação de Liquidação| DonationStore
    PurgeCron -->|Expurgo Automático 180d| TriageVault
    RLS --> TriageVault
    RLS --> ContactStore
    RLS --> DonationStore
```
