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

---

## 5. Remedição (07/11/2026)

As metas deste ADR foram medidas de novo no build atual. São **medidas de arquivos gerados pelo build**
(tamanho comprimido do que o navegador baixa), **não** métricas de experiência real dos usuários (LCP, INP, CLS ou
dados de campo), que continuam não medidas.

**Ambiente e metodologia**

| Item | Valor |
|---|---|
| Código | repositório `frontend`, `main` em `4a08dfc` |
| Build | `pnpm ci:verify` com pnpm 12.18.0 e Node 22.23 (Linux), `PUBLIC_*` de build público; 18 páginas estáticas |
| Dependências relevantes | Astro `^5.4`, Preact 10.29.8, Zod 4.6.7 (`zod/mini`), sharp 0.34.5 |
| JavaScript por página | HTML em `dist/`; `<script src>`, `modulepreload`, `component-url` e `renderer-url` das ilhas, mais os `import` estáticos de cada arquivo, de forma transitiva. Cada arquivo é comprimido com gzip nível 9 |
| JavaScript inline | Conteúdo dos `<script>` sem `src`, comprimido com gzip nível 9 e somado ao total |
| Imagens | Tamanho em bytes dos arquivos em `dist/_astro/` |
| Fora do escopo | Brotli (a hospedagem pode servir menor), cache, CDN, rede, CPU de dispositivos e métricas de campo |

**Tamanho do JavaScript e do HTML por página (gzip)**

| Página | HTML (gzip) | JS externo (gzip) | JS inline (gzip) | JS total (gzip) |
|---|---:|---:|---:|---:|
| `/404.html` | 4.9 KB | 1.0 KB | 1.6 KB | **2.6 KB** |
| `/campus/` | 8.7 KB | 1.0 KB | 1.6 KB | **2.6 KB** |
| `/conferencia/` | 7.2 KB | 1.0 KB | 1.6 KB | **2.6 KB** |
| `/contato/` | 8.4 KB | 25.9 KB | 3.3 KB | **29.1 KB** |
| `/curso/` | 6.4 KB | 1.0 KB | 1.6 KB | **2.6 KB** |
| `/doar/` | 7.1 KB | 15.6 KB | 3.1 KB | **18.8 KB** |
| `/doar/obrigado/` | 5.1 KB | 1.0 KB | 1.6 KB | **2.6 KB** |
| `/editora/` | 9.8 KB | 1.0 KB | 2.1 KB | **3.1 KB** |
| `/` | 21.4 KB | 1.0 KB | 2.6 KB | **3.6 KB** |
| `/newsletter/confirmar/` | 5.3 KB | 1.0 KB | 2.2 KB | **3.2 KB** |
| `/perguntas-frequentes/` | 6.7 KB | 1.0 KB | 2.9 KB | **3.9 KB** |
| `/politica-de-privacidade/` | 5.6 KB | 1.0 KB | 1.6 KB | **2.6 KB** |
| `/programas/` | 7.2 KB | 1.0 KB | 1.6 KB | **2.6 KB** |
| `/programas/residencial/` | 8.5 KB | 1.0 KB | 1.6 KB | **2.6 KB** |
| `/sobre/` | 8.9 KB | 1.0 KB | 2.0 KB | **3.0 KB** |
| `/triagem/` | 6.6 KB | 27.4 KB | 3.1 KB | **30.5 KB** |
| `/triagem/recebido/` | 5.1 KB | 1.0 KB | 1.6 KB | **2.6 KB** |
| `/viagem-eua/` | 7.6 KB | 1.0 KB | 1.6 KB | **2.6 KB** |

**Comparação com as metas**

| Meta do ADR | Medido agora | Situação |
|---|---|---|
| `/triagem` ≈ 30 KB | 30,5 KB (27,4 KB externo + 3,1 KB inline) | Confere |
| `/contato` ≈ 29 KB | 29,1 KB | Confere |
| `/doar` ≈ 19 KB | 18,8 KB | Confere |
| Foto de abertura no celular (640w, AVIF) ≈ 15 KB | 15.646 bytes (15,3 KiB) | Confere |
| Logo do cabeçalho ≈ 1 KB | Cabeçalho: variantes de 542 a 1.308 bytes; rodapé (logo branca): 2.570 bytes | Confere; a logo branca é maior que 1 KB |

Demais páginas, sem ilhas, carregam cerca de 2,6 a 3,9 KB de JavaScript (1,0 KB externo mais scripts inline).

**Imagem de abertura (`hero`), arquivos gerados**

| Largura | AVIF | WebP |
|---|---:|---:|
| 640w | 15.646 B | 25.698 B |
| 960w | 37.423 B | 57.718 B |
| 1280w | 61.176 B | 94.898 B |
| 1600w | 121.950 B | 182.122 B |

A imagem de compartilhamento `og-image.jpg` tem 196.808 bytes (não faz parte do carregamento da página).

??? note "Script usado na medição de JavaScript"
    Executar na raiz do `frontend`, depois do build (`node medir.mjs`).

    ```js
    // Mede, a partir de dist/ (build estático), o JS e as imagens por página. Não mede experiência real de usuários.
    import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
    import { gzipSync } from "node:zlib";
    import { join, dirname, resolve, relative } from "node:path";

    const dist = resolve("dist");
    const htmlFiles = [];
    (function walk(d) { for (const n of readdirSync(d)) { const f = join(d, n); statSync(f).isDirectory() ? walk(f) : f.endsWith(".html") && htmlFiles.push(f); } })(dist);

    const gz = (buf) => gzipSync(buf, { level: 9 }).length;
    const toFile = (url) => join(dist, url.split("?")[0].replace(/^\//, ""));

    function closure(entries) {
      const seen = new Map();
      const queue = [...entries];
      while (queue.length) {
        const f = queue.pop();
        if (seen.has(f) || !existsSync(f)) continue;
        const src = readFileSync(f);
        seen.set(f, src);
        const text = src.toString("utf8");
        for (const m of text.matchAll(/(?:from|import)\s*["'](\.{1,2}\/[^"']+\.js)["']/g)) queue.push(resolve(dirname(f), m[1]));
      }
      return seen;
    }

    const rows = [];
    for (const file of htmlFiles.sort()) {
      const html = readFileSync(file, "utf8");
      const entries = new Set();
      for (const m of html.matchAll(/<script[^>]+src="([^"]+\.js[^"]*)"/g)) entries.add(toFile(m[1]));
      for (const m of html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g)) entries.add(toFile(m[1]));
      for (const m of html.matchAll(/(?:component-url|renderer-url)="([^"]+\.js[^"]*)"/g)) entries.add(toFile(m[1]));
      const files = closure([...entries]);
      let js = 0; for (const b of files.values()) js += gz(b);
      const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].reduce((a, m) => a + gz(Buffer.from(m[1])), 0);
      const imgs = [...html.matchAll(/(?:src|srcset)="([^"]*)"/g)].flatMap((m) => m[1].split(",").map((s) => s.trim().split(" ")[0])).filter((u) => /\.(avif|webp|png|jpe?g|svg)$/.test(u));
      rows.push({ page: "/" + relative(dist, file).replace(/index\.html$/, ""), htmlGz: gz(Buffer.from(html)), jsGz: js, jsFiles: files.size, inlineGz: inline, imgRefs: new Set(imgs).size });
    }
    const kb = (n) => (n / 1024).toFixed(1);
    console.log("| Página | HTML (gzip) | JS externo (gzip) | JS inline (gzip) | JS total (gzip) |");
    console.log("|---|---:|---:|---:|---:|");
    for (const r of rows) console.log(`| \`${r.page}\` | ${kb(r.htmlGz)} KB | ${kb(r.jsGz)} KB | ${kb(r.inlineGz)} KB | **${kb(r.jsGz + r.inlineGz)} KB** |`);
    ```
