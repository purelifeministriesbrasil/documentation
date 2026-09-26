# ADR-001: Adoção do Astro 5 com SSG e Tailwind CSS v4

- **Status**: Aprovado
- **Data**: 2026-09-24
- **Decisores**: Equipe de Engenharia Pure Life Ministries Brasil

---

## 1. Contexto e Motivação

O portal ministerial da Pure Life Ministries Brasil requer máxima velocidade de carregamento, impecável indexação em mecanismos de busca (SEO) e compatibilidade com dispositivos móveis de baixa largura de banda. Pessoas que buscam ajuda para restauração sexual e espiritual frequentemente acessam o portal em momentos de extrema angústia e em ambientes com conectividade restrita.

SPAs monolíticas tradicionais (Next.js SSR pesado, Nuxt ou Create-React-App) introduzem excesso de JavaScript no cliente, atrasando o First Contentful Paint (FCP) e demandando servidores Node.js com custos de infraestrutura contínuos.

---

## 2. Decisão

Adotou-se o **Astro 5** com compilação estática pura (`output: 'static'`) combinado com **Tailwind CSS v4** e o modelo de **Ilhas de Arquitetura (React Islands)** para formulários interativos.

### Diretrizes de Implementação:
1. Todas as páginas informativas são compiladas em HTML estático no momento do build.
2. Interatividade é restrita a componentes isolados (`client:load` / `client:visible`), como formulários de triagem, contato e doação.
3. Eliminação completa de estilos inline residuais (`style="..."`), viabilizando Content Security Policy (CSP) restrita.

---

## 3. Alternativas Rejeitadas

- **Next.js (App Router / SSR)**: Rejeitado devido ao overhead de runtime de servidor, cold-starts desnecessários para conteúdo prioritariamente estático e maior custo operacional.
- **Vite SPA (React puro)**: Rejeitado por prejudicar SEO (necessidade de pré-renderização) e causar First Meaningful Paint lento em conexões móveis 3G/4G.
- **Wordpress / Elementor**: Rejeitado sumariamente por razões de segurança, histórico de vulnerabilidades, lentidão e impossibilidade de governança rígida sobre dados confidenciais (LGPD).

---

## 4. Consequências

### Impactos Positivos:
- **Desempenho Imbatível**: Páginas carregadas em menos de 500ms em edge CDN.
- **Segurança Reforçada**: Superfície de ataque estática nula no frontend; sem dependência de bancos expostos ou servidores vulneráveis.
- **Custo Operacional Zero**: Hospedagem estática com cache global na Vercel.

### Trade-offs:
- Conteúdo editorial demanda novo build para atualização de páginas estáticas (executado em ~6 segundos via GitHub Actions / Vercel Deploy Hook).
