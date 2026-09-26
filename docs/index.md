---
title: 'Pure Life Ministries Brasil — Console de Engenharia'
hide:
  - navigation
  - toc
---

<div class="blueprint-console">
  <div class="blueprint-badge">
    <span class="beacon-dot"></span>
    SISTEMA OPERACIONAL &bull; SOLI DEO GLORIA &bull; EST. 1986
  </div>
  
  <h1 class="blueprint-title">
    Pure Life Ministries Brasil<br>
    <span class="blueprint-title-gold">Arquitetura Canônica &amp; Engenharia</span>
  </h1>
  
  <p class="blueprint-subtitle">
    Portal corporativo de especificações técnicas, decisões de arquitetura e governança de segurança da informação.
    O ecossistema digital foi concebido para sustentar quatro décadas de aconselhamento bíblico sob estrito
    sigilo pastoral e conformidade irrestrita com a LGPD (Art. 11 &mdash; Dados Sensíveis).
  </p>

  <div class="telemetry-grid">
    <div class="telemetry-item">
      <div class="telemetry-label">Disponibilidade na Borda</div>
      <div class="telemetry-value">99.98% SLO</div>
      <div class="telemetry-sub">Vercel Edge Anycast &bull; 16 Rotas SSG &bull; LCP &lt; 0.8s</div>
    </div>
    <div class="telemetry-item">
      <div class="telemetry-label">Perímetro Criptográfico</div>
      <div class="telemetry-value">AES-256-GCM</div>
      <div class="telemetry-sub">Envelope AAD por Registro &bull; Chaves em Hardware</div>
    </div>
    <div class="telemetry-item">
      <div class="telemetry-label">Privacidade Pastoral</div>
      <div class="telemetry-value">Zero PII Logs</div>
      <div class="telemetry-sub">Scrubber de Telemetria &bull; Sem Rastro em Logs</div>
    </div>
    <div class="telemetry-item">
      <div class="telemetry-label">Governança Temporal</div>
      <div class="telemetry-value">180d Purge</div>
      <div class="telemetry-sub">Cron Diário 03:00 UTC &bull; Expurgo Irreversível</div>
    </div>
  </div>
  
  <div class="blueprint-cta">
    <a href="architecture/system-overview/" class="md-button md-button--primary">Visão Geral da Arquitetura</a>
    <a href="architecture/repositories-scope/" class="md-button">Fronteiras dos Repositórios</a>
    <a href="security/threat-model/" class="md-button">Modelagem de Ameaças &amp; LGPD</a>
    <a href="operations/deployment/" class="md-button">Runbooks &amp; Operações</a>
  </div>
</div>

---

<div class="section-anchor-header" markdown>

## Divisão Canônica em Três Pilares
<div class="gold-separator"></div>
<p class="section-anchor-sub">
Isolamento estrito de responsabilidades e segurança: <strong>"Front com Front, Back com Back e Docs com Docs"</strong>.
</p>

</div>

<div class="pillars-container">

<div class="pillar-card">
  <div>
    <div class="pillar-top">
      <span class="pillar-badge">REPO: frontend</span>
      <span class="pillar-status">&bull; 100% Estático</span>
    </div>
    <h3 class="pillar-title">Borda &amp; Experiência Visual</h3>
    <p class="pillar-desc">
      Interface pública ultraveloz, acessível e blindada contra injeção de código ou vazamento de segredos.
    </p>
    <ul class="pillar-list">
      <li>&check; 16 páginas estáticas compiladas com Astro 5 SSG</li>
      <li>&check; Ilhas React isoladas para formulários sensíveis</li>
      <li>&check; Tailwind CSS v4 com tokens institucionais</li>
      <li>&check; Zero chaves administrativas (apenas cliente <code>anon</code>)</li>
      <li>&check; Zero estilos residuais inline e zero fontes externas não auditadas</li>
    </ul>
  </div>
  <div style="margin-top: 1rem;">
    <a href="architecture/repositories-scope/#a-repositorio-frontend-front-com-front" class="md-button md-button--primary" style="width: 100%; text-align: center; font-size: 0.82rem;">
      Explorar Escopo Frontend &rarr;
    </a>
  </div>
</div>

<div class="pillar-card">
  <div>
    <div class="pillar-top">
      <span class="pillar-badge">REPO: backend</span>
      <span class="pillar-status">&bull; Serverless 24/7</span>
    </div>
    <h3 class="pillar-title">Núcleo &amp; Webhooks Financeiros</h3>
    <p class="pillar-desc">
      Microsserviços serverless na Cloudflare para liquidação de doações via PIX e manutenção confidencial.
    </p>
    <ul class="pillar-list">
      <li>&check; Validação anti-bot Cloudflare Turnstile nativa</li>
      <li>&check; Webhooks PIX idempotentes (Asaas e Mercado Pago)</li>
      <li>&check; Assinatura criptográfica HMAC-SHA256 validada</li>
      <li>&check; Lease atômico contra duplicidade de doação</li>
      <li>&check; Cron de expurgo diário às 03:00 UTC (180 dias)</li>
    </ul>
  </div>
  <div style="margin-top: 1rem;">
    <a href="architecture/repositories-scope/#b-repositorio-backend-back-com-back" class="md-button md-button--primary" style="width: 100%; text-align: center; font-size: 0.82rem;">
      Explorar Escopo Backend &rarr;
    </a>
  </div>
</div>

<div class="pillar-card">
  <div>
    <div class="pillar-top">
      <span class="pillar-badge">REPO: docs</span>
      <span class="pillar-status">&bull; Fonte da Verdade</span>
    </div>
    <h3 class="pillar-title">Governança &amp; Auditoria</h3>
    <p class="pillar-desc">
      O repositório central de decisões de engenharia, requisitos contratuais e manuais de resposta a incidentes.
    </p>
    <ul class="pillar-list">
      <li>&check; Portal MkDocs Material com build estrito validado</li>
      <li>&check; 5 Decisões formais de Arquitetura (ADRs 001 a 005)</li>
      <li>&check; Especificação de Requisitos SRS v2.0 completa</li>
      <li>&check; Modelagem de ameaças STRIDE e conformidade LGPD</li>
      <li>&check; Runbooks operacionais, observabilidade e contingência</li>
    </ul>
  </div>
  <div style="margin-top: 1rem;">
    <a href="architecture/repositories-scope/#c-repositorio-documentation-docs-com-docs" class="md-button md-button--primary" style="width: 100%; text-align: center; font-size: 0.82rem;">
      Explorar Escopo Docs &rarr;
    </a>
  </div>
</div>

</div>

---

<div class="section-anchor-header" markdown>

## Perímetro Criptográfico de Sigilo Pastoral
<div class="gold-separator"></div>
<p class="section-anchor-sub">
O ciclo de vida de dados confidenciais desde a coleta na borda até a destruição criptográfica definitiva.
</p>

</div>

<div class="crypto-pipeline">
  <div class="crypto-step">
    <div class="crypto-step-num">ETAPA 01</div>
    <div class="crypto-step-title">Desafio Borda</div>
    <div class="crypto-step-desc">Turnstile bloqueia tráfego hostil e bots antes do processamento.</div>
  </div>
  <div class="crypto-step">
    <div class="crypto-step-num">ETAPA 02</div>
    <div class="crypto-step-title">Envelope Cripto</div>
    <div class="crypto-step-desc">AES-256-GCM cifra o relato pastoral com AAD vinculado ao ID.</div>
  </div>
  <div class="crypto-step">
    <div class="crypto-step-num">ETAPA 03</div>
    <div class="crypto-step-title">Persistência RLS</div>
    <div class="crypto-step-desc">Inserção direta no Supabase com permissão exclusiva INSERT ONLY.</div>
  </div>
  <div class="crypto-step">
    <div class="crypto-step-num">ETAPA 04</div>
    <div class="crypto-step-title">Sanitização</div>
    <div class="crypto-step-desc">Scrubber em tempo real mascara PII em logs e telemetria externa.</div>
  </div>
  <div class="crypto-step">
    <div class="crypto-step-num">ETAPA 05</div>
    <div class="crypto-step-title">Expurgo 180d</div>
    <div class="crypto-step-desc">Cron agendado remove registros inativos permanentemente.</div>
  </div>
</div>

---

<div class="section-anchor-header" markdown>

## Acesso Direto aos Recursos Técnicos
<div class="gold-separator"></div>

</div>

<div class="four-columns-grid">
  <div class="four-card">
    <div>
      <div class="four-card-header">
        <span>📄</span>
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
        <span>🛡️</span>
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
        <span>📦</span>
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
        <span>⚙️</span>
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

