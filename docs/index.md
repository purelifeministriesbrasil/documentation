---
title: 'Pure Life Ministries Brasil — Plataforma Tecnológica'
hide:
  - navigation
  - toc
---

<div class="animated-hero" markdown="1">

  <div class="hero-badge">:material-shield-check: Plataforma Tecnológica & Governança de Dados</div>
  
  <h1 class="hero-title">Acolhimento Sagrado,<br>Segurança Inviolável.</h1>
  
  <p class="hero-subtitle">
    Portal técnico oficial de engenharia, arquitetura de software, conformidade estrita com a LGPD (Art. 11),
    contratos de dados e runbooks operacionais do ecossistema Pure Life Ministries Brasil.
  </p>
  
  <div class="hero-cta" markdown="1">

  [Explorar Arquitetura :material-compass-outline:](architecture/system-overview.md){ .md-button .md-button--primary }
  [Especificação de Requisitos :material-file-document-check-outline:](requirements/especificacao-requisitos-ecossistema.md){ .md-button }
  [Runbooks & Deploy :material-server-network:](operations/deployment.md){ .md-button }

  </div>

</div>

---

<div class="section-heading" markdown>

## :material-shield-crown-outline: Pilares do Ecossistema Tecnológico

</div>

<p class="section-subtitle">
Engenharia desenvolvida sob a premissa inegociável: <strong>Corretude > Segurança & Privacidade > Observabilidade > Simplicidade > Velocidade de Entrega</strong>.
</p>

<div class="grid cards" markdown>

- :material-shield-lock-outline: **Proteção Criptográfica & LGPD Art. 11**
  
    ---
    Cifra simétrica de fluxo autenticada AES-256-GCM com Dados Adicionais Autenticados (AAD vinculando `triagem_id`), rotina automatizada de expurgo temporal (180 dias) e trilha de auditoria append-only.

- :material-database-lock-outline: **Supabase Postgres & RLS Rígido**
  
    ---
    Banco de dados relacional com isolamento transacional e Row Level Security (RLS) estrito. O público anônimo possui permissão exclusiva de submissão (`INSERT ONLY`), tornando matematicamente impossível a leitura pública de registros de terceiros.

- :material-lightning-bolt-outline: **Ultra-Performance na Vercel Edge**
  
    ---
    16 rotas institucionais compiladas em HTML 100% estático (Astro 5 SSG), CDN global Anycast com TTFB < 100ms, zero CSS residual inline e pontuações máximas no Core Web Vitals (LCP < 1.0s, INP < 50ms, CLS = 0).

- :material-cash-fast: **Pagamentos & Webhooks Idempotentes**
  
    ---
    Integração de checkout com PIX dinâmico (Asaas), assegurada por leases atômicos consultivos (`pg_try_advisory_xact_lock`) e validação criptográfica HMAC contra duplicidade de cobrança.

- :material-folder-network-outline: **Segregação Estrita de Repositórios**
  
    ---
    Governança sólida: <em>"Front com Front, Back com Back, Docs com Docs"</em>. Três repositórios desacoplados e autocontidos, com esquemas Zod nativos e pipelines de CI independentes.

- :material-clipboard-text-search-outline: **Decisões Auditáveis & Governança**
  
    ---
    Registros formais de Decisões de Arquitetura (ADRs 001 a 005), diagramas de sequência C4/Mermaid, catálogo canônico de requisitos (SRS v2.0) e runbooks operacionais passo a passo.

</div>

---

<div class="section-heading" markdown>

## :material-layers-triple: Topologia dos Repositórios Ativos

</div>

<p class="section-subtitle">
Estrutura desacoplada e independente para máxima manutenibilidade e segurança operacional.
</p>

<div align="center" markdown>

| Repositório | Stack Tecnológica | Finalidade no Ecossistema | Borda / Hospedagem |
| :--- | :--- | :--- | :--- |
| **`frontend`** | Astro 5, Tailwind CSS v4, React (Ilhas), Supabase-JS, Zod | Portal institucional público, formulários de triagem, vitrine ministerial | **Vercel Edge Network** |
| **`backend`** | TypeScript, Cloudflare Workers, Asaas SDK, Drizzle | Webhooks bancários assíncronos PIX, cron jobs de expurgo LGPD | **Cloudflare Workers** |
| **`documentation`** | Material for MkDocs, Python, GitHub Pages | Documentação técnica canônica, ADRs, runbooks e SRS v2.0 | **GitHub Pages** |

[:material-arrow-right: Ver Fronteiras e Escopo dos Repositórios](architecture/repositories-scope.md){ .md-button style="margin-top: 1rem;" }

</div>

---

<div class="section-heading" markdown>

## :material-rocket-launch-outline: Início Rápido para Engenharia

</div>

<p class="section-subtitle">
Execute os serviços localmente ou sirva este portal de documentação em segundos.
</p>

=== "Servir Documentação (uv / Python)"

    ```bash
    # Clone o repositório de documentação
    git clone https://github.com/purelifeministriesbrasil/documentation.git
    cd documentation

    # Sirva a documentação com recarregamento em tempo real (http://127.0.0.1:8000)
    uv run --with "mkdocs>=1.6.0" --with "mkdocs-material>=9.5.0" --with "pymdown-extensions>=10.7" mkdocs serve
    ```

=== "Frontend Web (pnpm / Node.js 22)"

    ```bash
    # Clone o frontend
    git clone https://github.com/purelifeministriesbrasil/frontend.git
    cd frontend

    # Instale as dependências e inicie o ambiente de desenvolvimento (http://localhost:4321)
    pnpm install
    pnpm dev

    # Validação rigorosa de CI (Build + Topologia + Zero Inline Style)
    pnpm ci:verify
    ```

=== "Backend Worker (Cloudflare / Wrangler)"

    ```bash
    # Clone o backend
    git clone https://github.com/purelifeministriesbrasil/backend.git
    cd backend

    # Instale e execute o servidor local do Worker
    pnpm install
    pnpm dev

    # Testes unitários e verificação de Clean Architecture
    pnpm test
    pnpm lint
    ```

---

<div class="section-heading" markdown>

## :material-map-legend: Mapa Executivo de Documentação

</div>

<div class="grid cards" markdown>

- :material-compass: **[Arquitetura & Engenharia](architecture/system-overview.md)**
    Visão geral da topologia, diagramas de sequência, modelo de dados relacional e índice completo de ADRs.

- :material-shield-lock: **[Segurança & LGPD](security/threat-model.md)**
    Modelagem de ameaças (Threat Model), conformidade com o Art. 11 da LGPD e arquitetura criptográfica AES-GCM.

- :material-code-json: **[Contratos & Schemas](schemas/triage-schema.md)**
    Especificações e regras de validação estritas (Zod) para formulários de triagem, contato e doações.

- :material-server: **[Operações & Runbooks](operations/deployment.md)**
    Deploy na Vercel, hardening do Supabase, gestão de credenciais, backups e disaster recovery.

- :material-file-document: **[Especificações & SRS](requirements/especificacao-requisitos-ecossistema.md)**
    Catálogo formal de requisitos funcionais e não funcionais (SRS v2.0.0) e glossário canônico.

- :material-scale-balance: **[Governança Corporativa](governance/code-of-conduct.md)**
    Código de conduta ministerial, políticas de segurança, diretrizes de contribuição e licenças.

</div>
