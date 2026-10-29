# ADR-009 — Performance: ilhas em Preact, `zod/mini` e imagens responsivas

- **Status**: Aprovado (complementa o [ADR-001](ADR-001-astro-ssg-tailwind.md))
- **Data**: 2026-10-15
- **Decisores**: Equipe de Engenharia Pure Life Ministries Brasil

---

## 1. Contexto

Uma medição do build de produção mostrou três gargalos reais, todos no navegador:

| Item | Medida antes |
|---|---|
| Logo do cabeçalho (todas as páginas) | PNG de 309 KB (5394×6584 px) exibido com 44 px de altura |
| Foto de abertura no celular | 321 KB, a mesma imagem enviada a qualquer tela |
| JavaScript das páginas de formulário (gzip) | `/triagem` 104 KB, `/contato` 102 KB, `/doar` 75 KB |

O JavaScript vinha quase todo do **React** (cerca de 67 KB gzip) e do **Zod** completo (cerca de 27 KB gzip).
A Home não carrega nenhuma ilha, então não era afetada.

## 2. Decisão

1. **Ilhas em Preact** com a camada de compatibilidade (`@astrojs/preact` com `compat: true`). Os componentes
   continuam escritos com a API do React (`useState`, `onChange` a cada tecla), e os ícones vêm de
   `lucide-preact`. Os handlers usam `e.currentTarget` para manter a tipagem estrita.
2. **Schemas com `zod/mini`**: mesma versão do Zod (4.6.7), mesmas regras e mensagens, com a API funcional que
   permite *tree-shaking*. Os arquivos de `src/schemas/` continuam **idênticos byte a byte** entre `frontend` e
   `backend`, e o `verify-boundaries` aceita o subpacote oficial.
3. **Imagens com `astro:assets`**: fontes de alta qualidade em `src/assets/images/`, servidas com `<Picture>` em
   **AVIF** com *fallback* WebP e `srcset`/`sizes`. A imagem de abertura usa `fetchpriority="high"`; as demais,
   `loading="lazy"`. O processamento usa `sharp`, declarado no projeto.
4. **Prefetch** do Astro em todos os links com a estratégia `hover`; a fonte Montserrat é pré-carregada.
5. **Imagem de compartilhamento** (`og:image`) com URL absoluta e 1200×630 px.

## 3. Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Valibot no lugar do Zod | Ganho parecido ao `zod/mini`, mas exigiria reescrever todos os schemas e mensagens |
| Prefetch `viewport` em todos os links | Baixaria cerca de 20 páginas por visita no celular |
| Carregar o Turnstile só ao focar no formulário | O formulário é o conteúdo principal dessas páginas; o usuário poderia enviar antes do token ficar pronto |
| Player do YouTube incorporado | Os vídeos já usam miniatura com link (sem iframe), sem custo de script de terceiros |

## 4. Consequências

**Resultado medido (build de produção)**

| Item | Depois |
|---|---|
| Logo do cabeçalho | cerca de 1 KB |
| Foto de abertura no celular (640w, AVIF) | 15 KB |
| JavaScript `/triagem` · `/contato` · `/doar` (gzip) | 30 KB · 29 KB · 19 KB |

**Trade-offs**

- O build fica alguns segundos mais lento por gerar as variantes de imagem.
- Novas bibliotecas de interface precisam funcionar com `preact/compat`; prefira versões nativas para Preact
  (como `lucide-preact`) quando existirem.
- Para trocar uma foto, substitua o arquivo em `src/assets/images/` mantendo o nome (ver
  [Gestão de Conteúdo do Site](../operations/content-management.md)).
