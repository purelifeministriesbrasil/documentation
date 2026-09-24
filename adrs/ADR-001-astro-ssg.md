# ADR-001 — Adoção de Astro SSG e Descarte de SPA React Monolítica em Produção

## Status
Aprovado (§1.2 e ADR-001 da Especificação Canónica v5.0).

## Contexto
O protótipo inicial foi desenvolvido como uma Single Page Application (SPA) em React 19 + Vite com um arquivo `App.tsx` monolítico de ~1.086 linhas. Embora eficaz para validar a experiência visual e a redação pastoral, a arquitetura SPA impõe riscos críticos:
1. Carga inicial pesada (~250 KB de JS para renderizar conteúdo puramente institucional/editorial).
2. Dependência de execução de JavaScript no navegador para indexação por motores de busca (SEO).
3. Risco de vazamento de credenciais e acoplamento entre páginas institucionais e APIs transacionais.

## Decisão
1. O template React 19 + Vite existente é considerado **estritamente uma referência visual, de copy e de tokens**. Nenhuma linha do `App.tsx` original vai para produção como SPA.
2. O frontend oficial (`purelife-web`) adota **Astro** com saída 100% estática (`prerender = true`), hospedado na Cloudflare.
3. Componentes interativos que exigem estado reativo (como formulário de triagem, contato e doação Pix) são isolados como **React 19 Islands** pontuais carregadas sob demanda via `client:load` ou `client:idle`.
4. As 16 seções da Home Page são convertidas em componentes Astro 100% estáticos com microinterações em Vanilla JS nativo, reduzindo o orçamento de JS da Home para $\le$ 8 KB gzip.

## Consequências
- **Positivas**:
  - Orçamento de JavaScript da Home transferido caiu para ~1.02 KB gzip (sem React global na Home).
  - TTFB e LCP imediatos servidos diretamente da borda da CDN Cloudflare.
  - Zero vulnerabilidade de runtime SSR ou dependência de Node.js em produção.
  - Resiliência total: falhas em serviços externos não derrubam as páginas públicas institucionais.
