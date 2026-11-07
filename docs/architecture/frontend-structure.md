# Estrutura do Frontend

Site estático em **Astro 5** (`output: 'static'`) com **ilhas Preact** em [`frontend/src`](https://github.com/purelifeministriesbrasil/frontend/blob/4a08dfc03ef6f5cc6adf907da5bfa454960a9add/src). Baseline: frontend `4a08dfc`. Contexto: [Visão Geral](system-overview.md) e [ADR-009](../adrs/ADR-009-performance-ilhas-preact-imagens.md).

## 1. Rotas (18 páginas estáticas)

As 18 saídas são exigidas por [`verify-topology.mjs`](https://github.com/purelifeministriesbrasil/frontend/blob/4a08dfc03ef6f5cc6adf907da5bfa454960a9add/scripts/verify-topology.mjs), que falha o build se alguma não existir como HTML estático.

| Rota | Arquivo em `src/pages/` | Ilha interativa |
|---|---|---|
| `/` | `index.astro` | — (formulário de newsletter com aprimoramento progressivo) |
| `/sobre/` | `sobre.astro` | — |
| `/conferencia/` | `conferencia.astro` | — |
| `/editora/` | `editora.astro` | — |
| `/campus/` | `campus.astro` | — |
| `/viagem-eua/` | `viagem-eua.astro` | — |
| `/programas/` e `/programas/residencial/` | `programas/index.astro`, `programas/residencial.astro` | — |
| `/curso/` | `curso.astro` | — |
| `/triagem/` e `/triagem/recebido/` | `triagem/index.astro`, `triagem/recebido.astro` | `TriageForm` (`client:load`) |
| `/doar/` e `/doar/obrigado/` | `doar/index.astro`, `doar/obrigado.astro` | `DonationForm` ou `ManualPixDonation` (`client:load`), conforme `PUBLIC_ENABLE_PIX_GATEWAY` |
| `/contato/` | `contato.astro` | `ContactForm` (`client:visible`) |
| `/perguntas-frequentes/` | `perguntas-frequentes.astro` | — |
| `/politica-de-privacidade/` | `politica-de-privacidade.astro` | — |
| `/newsletter/confirmar/` | `newsletter/confirmar.astro` | Script de confirmação (token no fragmento da URL) |
| `/404.html` | `404.astro` | — |

## 2. Componentes

| Pasta | Conteúdo |
|---|---|
| `components/layout/` | `Header`, `Footer`, `Navigation` (Astro) e `mobile-nav.ts` |
| `components/home/` | Seções da Home (`Hero`, `MissionPillars`, `ProgramsSection`, `FAQPreview`, `NewsletterSection`, etc.) |
| `components/forms/` | `TriageForm.tsx`, `ContactForm.tsx`, `Turnstile.tsx` (ilhas Preact), `NewsletterForm.astro` e `newsletter-enhance.ts` |
| `components/donations/` | `DonationForm.tsx` (PIX dinâmico) e `ManualPixDonation.tsx` (chave PIX do CNPJ) |
| `components/ui/` | `Button`, `Container`, `SectionHeading`, `SkipLink` (Astro) e `Checkbox.tsx` |
| `components/about`, `course`, `programs` | Blocos específicos de página |
| `layouts/` | `BaseLayout.astro` (head, SEO, JSON-LD) e `ContentLayout.astro` |

**Ilha × componente Astro**: componentes `.astro` são renderizados no build e não enviam JavaScript; arquivos `.tsx` com diretiva `client:*` são hidratados no navegador.

## 3. Dados, conteúdo e API

| Item | Local | Papel |
|---|---|---|
| Configuração institucional | [`lib/site-config.ts`](https://github.com/purelifeministriesbrasil/frontend/blob/4a08dfc03ef6f5cc6adf907da5bfa454960a9add/src/lib/site-config.ts) | Contatos, links, origem do site, `apiBaseUrl` (de `PUBLIC_API_URL`), site key do Turnstile e versão da política de privacidade registrada no consentimento |
| Conteúdo editável | `src/data/` (`programs`, `testimonials`, `timeline`, `campus-photos`, `usa-trip`) | Ver [Gestão de Conteúdo](../operations/content-management.md) |
| Cliente HTTP | [`lib/api.ts`](https://github.com/purelifeministriesbrasil/frontend/blob/4a08dfc03ef6f5cc6adf907da5bfa454960a9add/src/lib/api.ts) | `postJson` com timeout de 15 s e cabeçalho `Idempotency-Key` (UUID v4 por tentativa lógica) |
| Contratos | `src/schemas/` | Cópia dos schemas do backend; ver [Schemas comuns](../schemas/common-schema.md) |
| SEO | `lib/seo.ts`, `BaseLayout.astro` | Meta tags e JSON-LD |

## 4. Imagens e fontes

- Imagens em `src/assets/images/` (incluindo `campus/` e `books/`), processadas por `astro:assets`. Os arquivos de origem estão em `.webp`; os componentes que declaram `formats={["avif", "webp"]}` (por exemplo `Hero`, `AboutPreview`, `CampusPreview`, `ConferencePreview`, `ProgramCard`) geram saídas responsivas nesses dois formatos (ADR-009).
- Fontes em `public/fonts/` (Ruda e Montserrat) declaradas em `styles/fonts.css`; ver [Design System](../design-system/design-system.md).

## 5. Segurança no build e na entrega

| Mecanismo | Arquivo | Efeito |
|---|---|---|
| Cabeçalhos e cache | [`public/_headers`](https://github.com/purelifeministriesbrasil/frontend/blob/4a08dfc03ef6f5cc6adf907da5bfa454960a9add/public/_headers) | HSTS, `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`; `no-store` em `/triagem/*` e `/newsletter/*` |
| CSP por hash | [`scripts/generate-csp.mjs`](https://github.com/purelifeministriesbrasil/frontend/blob/4a08dfc03ef6f5cc6adf907da5bfa454960a9add/scripts/generate-csp.mjs) | Substitui `__CSP__` com os SHA-256 dos scripts inline e a origem da API; **falha o build** se houver handlers inline |
| Sem estilo inline | `scripts/verify-no-inline-style.mjs` | Falha se houver atributo `style` |
| Redirecionamentos | `public/_redirects` | 301 do site antigo (WordPress) |

## 6. Verificação

`pnpm ci:verify` = `typecheck` (`astro check && tsc --noEmit`) + `build` + `verify:topology` + `verify:no-inline-style`. O frontend **não possui testes unitários**; a cobertura é estrutural. Ver [Testes e CI/CD](../quality/testing-and-cicd.md).
