---
title: 'Pure Life Ministries Brasil — Plataforma Tecnológica'
hide:
  - navigation
  - toc
---

<div class="executive-hero" markdown="1">

  <div class="executive-badge">Documentação Técnica Oficial</div>
  
  <h1 class="executive-title">Pure Life Ministries Brasil</h1>
  
  <p class="executive-subtitle">
    Portal Corporativo de Engenharia, Arquitetura de Software, Segurança da Informação (LGPD Art. 11),
    Contratos de Dados e Procedimentos Operacionais do Ecossistema Ministerial.
  </p>
  
  <div class="executive-cta" markdown="1">

  [Visão Geral da Arquitetura](architecture/system-overview.md){ .md-button .md-button--primary }
  [Especificação de Requisitos (SRS)](requirements/especificacao-requisitos-ecossistema.md){ .md-button }
  [Operações & Runbooks](operations/deployment.md){ .md-button }

  </div>

</div>

---

<div class="section-header" markdown>

## Princípios de Engenharia & Governança
<div class="gold-divider"></div>
<p class="section-desc">
A arquitetura do ecossistema foi projetada sob o princípio de tolerância zero a falhas em dados sensíveis:
<strong>Corretude > Segurança & Privacidade > Observabilidade > Simplicidade > Velocidade de Entrega</strong>.
</p>

</div>

<div class="grid cards" markdown>

- **Privacidade & Conformidade Estrita LGPD**
  
    ---
    Tratamento rigoroso de dados de aconselhamento confidencial (Art. 11 da Lei nº 13.709/2018). Criptografia de ponta a ponta com AES-256-GCM + AAD vinculado ao identificador do registro, expurgo temporal automático (180 dias) e trilha de auditoria append-only.

- **Persistência Segura no Supabase Postgres**
  
    ---
    Banco de dados relacional com Row Level Security (RLS) habilitado. Políticas restritas asseguram que clientes anônimos possuem permissão de inserção exclusiva (`INSERT ONLY`), eliminando qualquer risco de leitura pública de registros de terceiros.

- **Disponibilidade & Borda na Vercel Edge**
  
    ---
    16 rotas institucionais compiladas em HTML estático de alto desempenho (Astro 5 SSG), CDN global Anycast com tempo de resposta inferior a 100ms, zero CSS residual inline e pontuações máximas em Core Web Vitals (LCP < 1.0s, INP < 50ms, CLS = 0).

- **Pagamentos & Webhooks Idempotentes**
  
    ---
    Integração de checkout e doações com PIX dinâmico (Asaas), protegida por leases atômicos transacionais no banco de dados (`pg_try_advisory_xact_lock`) e validação criptográfica HMAC contra duplicidade de cobrança.

- **Fronteiras e Segregação de Repositórios**
  
    ---
    Governança estrita: <em>"Front com Front, Back com Back, Docs com Docs"</em>. Três repositórios isolados e autônomos, sem dependências circulares, pacotes locais acoplados ou pipelines de CI cruzados.

- **Rastreabilidade e Decisões de Arquitetura**
  
    ---
    Registros formais de Decisões de Arquitetura (ADRs 001 a 005), diagramas de sequência, modelo de dados relacional e runbooks operacionais auditáveis.

</div>

---

<div class="section-header" markdown>

## Topologia dos Repositórios Ativos
<div class="gold-divider"></div>
<p class="section-desc">
Segregação estrutural dos três projetos fundamentais que compõem o ecossistema digital.
</p>

</div>

<div align="center" markdown>

| Repositório | Stack Tecnológica | Papel no Ecossistema | Infraestrutura / Borda |
| :--- | :--- | :--- | :--- |
| **`frontend`** | Astro 5, Tailwind CSS v4, React (Ilhas), Supabase-JS, Zod | Interface pública web, 16 rotas estáticas, formulários | **Vercel Edge Network** |
| **`backend`** | TypeScript, Cloudflare Workers, Asaas SDK, Drizzle | Webhooks bancários PIX, cron diário de expurgo LGPD | **Cloudflare Workers** |
| **`documentation`** | Material for MkDocs, Python, GitHub Pages | Documentação técnica canônica, ADRs, runbooks e SRS | **GitHub Pages** |

[:material-arrow-right: Consultar Fronteiras e Escopo dos Repositórios](architecture/repositories-scope.md){ .md-button style="margin-top: 1rem;" }

</div>

---

<div class="section-header" markdown>

## Guia Rápido de Execução Local
<div class="gold-divider"></div>
<p class="section-desc">
Instruções para inicialização dos ambientes locais de desenvolvimento e visualização da documentação.
</p>

</div>

=== "Servir Documentação (uv / Python)"

    ```bash
    # Clone o repositório de documentação
    git clone https://github.com/purelifeministriesbrasil/documentation.git
    cd documentation

    # Inicie o servidor local com recarregamento em tempo real (http://127.0.0.1:8000)
    uv run --with "mkdocs>=1.6.0" --with "mkdocs-material>=9.5.0" --with "pymdown-extensions>=10.7" mkdocs serve
    ```

=== "Frontend Web (pnpm / Node.js 22)"

    ```bash
    # Clone o repositório frontend
    git clone https://github.com/purelifeministriesbrasil/frontend.git
    cd frontend

    # Instale as dependências e inicie o ambiente de desenvolvimento (http://localhost:4321)
    pnpm install
    pnpm dev

    # Validação completa de compilação, topologia e estilo
    pnpm ci:verify
    ```

=== "Backend Worker (Cloudflare / Wrangler)"

    ```bash
    # Clone o repositório backend
    git clone https://github.com/purelifeministriesbrasil/backend.git
    cd backend

    # Instale as dependências e execute os testes locais
    pnpm install
    pnpm test
    pnpm lint
    ```

---

<div class="section-header" markdown>

## Estrutura de Navegação da Documentação
<div class="gold-divider"></div>

</div>

<div class="grid cards" markdown>

- **[Arquitetura & Engenharia](architecture/system-overview.md)**
    Visão geral da topologia, diagramas de sequência, modelo de dados relacional, design system e decisões ADR.

- **[Segurança & LGPD](security/threat-model.md)**
    Modelagem de ameaças, conformidade com o Art. 11 da LGPD, arquitetura criptográfica e políticas de segurança.

- **[Contratos & Schemas](schemas/triage-schema.md)**
    Esquemas de validação estritos (Zod) para formulários de triagem residencial, contato geral, doações e newsletter.

- **[Operações & Runbooks](operations/deployment.md)**
    Procedimentos de deploy na Vercel, hardening do Supabase, rotação de chaves e gestão de backups.

- **[Especificações & Requisitos](requirements/especificacao-requisitos-ecossistema.md)**
    Catálogo formal de requisitos funcionais e não funcionais (SRS v2.0.0) e glossário técnico canônico.

- **[Governança Corporativa](governance/code-of-conduct.md)**
    Código de conduta ministerial, diretrizes de contribuição para engenheiros e licenças de software.

</div>
