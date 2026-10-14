# ADR-007 — Frontend no Cloudflare Pages e migração para contas institucionais

- **Status**: Aprovado (substitui o [ADR-003](ADR-003-vercel-hospedagem-borda.md))
- **Data**: 2026-10-13

## Contexto

O ecossistema rodava em contas pessoais (Supabase, Vercel, Cloudflare). Para uma organização, a Vercel exige o
plano Pro (US$ 20/mês por membro). A API já é um Cloudflare Worker, e a zona DNS do ministério ficará na conta
Cloudflare institucional. O `vercel.json` também fazia *rewrite* de `/api/*` para o Worker, recurso que o
Cloudflare Pages não oferece para hosts externos.

## Decisão

1. Publicar o frontend Astro (SSG) no **Cloudflare Pages** da conta institucional; remover `vercel.json`.
2. Headers de segurança em `public/_headers`. O CSP é **gerado no build** (`scripts/generate-csp.mjs`) com hashes
   SHA-256 dos scripts inline do Astro, sem `'unsafe-inline'` em `script-src`.
3. O frontend chama a API em **`PUBLIC_API_URL`** (`https://api.purelifebrasil.org`) com CORS restrito a
   `PUBLIC_SITE_ORIGIN`; a API usa *custom domain* do Worker na mesma zona.
4. `backend/drizzle/` passa a ser a **única** fonte do schema; o SQL legado do frontend foi removido.

## Alternativas consideradas

- **Manter a Vercel (Pro)**: custo recorrente sem ganho funcional para um site estático.
- **Worker route em `purelifebrasil.org/api/*`** (mesma origem): elimina CORS, mas acopla os deploys e exige
  regras de rota adicionais; mantido como opção (`PUBLIC_API_URL` vazio usa caminho relativo).
- **CSP com `'unsafe-inline'`**: mais simples, porém anula a proteção contra XSS de scripts injetados.

## Consequências

- Custo de hospedagem zero no plano gratuito do Pages/Workers para o volume esperado.
- Um único provedor de borda (DNS, WAF, Turnstile, Pages, Workers) e um único painel de faturamento.
- O CSP depende do build: qualquer novo script inline é coberto automaticamente; handlers inline
  (`onclick="…"`) quebram o build de propósito.
- Requisições à API são *cross-origin* (`same-site`): o Worker valida `Origin` e `Sec-Fetch-Site`.
