# Design System & Identidade Visual

O Design System da Pure Life Ministries Brasil foi projetado para transmitir **reverência, acolhimento, solidez doutrinária e excelência visual**, combinando tradição clássica com tecnologias modernas de interface web.

---

## 1. Paleta de Cores Institucional

A paleta de cores reflete a herança litúrgica cristã e a sobriedade necessária ao ministério de restauração:

| Nome do Token | Valor Hex | Amostra | Finalidade Principal |
| :--- | :---: | :---: | :--- |
| **Royal Blue** | `#044A82` | <span style="background-color:#044A82;display:inline-block;width:24px;height:24px;border-radius:4px;"></span> | Cor primária institucional, botões de ação e cabeçalhos |
| **Midnight Graphite** (`--color-surface-inverse`, `--color-text`) | `#1C2530` | <span style="background-color:#1C2530;display:inline-block;width:24px;height:24px;border-radius:4px;"></span> | Fundo de cabeçalhos, rodapé, superfícies escuras e diálogos |
| **Golden Crown** | `#D99B26` | <span style="background-color:#D99B26;display:inline-block;width:24px;height:24px;border-radius:4px;"></span> | Acentos, foco acessível, badges e destaques solenes |
| **Parchment Sand** | `#C1BDA6` | <span style="background-color:#C1BDA6;display:inline-block;width:24px;height:24px;border-radius:4px;"></span> | Subtítulos elegantes, bordas suaves e detalhes litúrgicos |
| **Clean White** | `#FFFFFF` | <span style="background-color:#FFFFFF;display:inline-block;width:24px;height:24px;border-radius:4px;border:1px solid #ccc;"></span> | Fundo de cartões no modo claro e texto principal em áreas escuras |
| **Slate Border** | `#3B4C60` | <span style="background-color:#3B4C60;display:inline-block;width:24px;height:24px;border-radius:4px;"></span> | Divisores sutis e linhas de separação |

---

## 2. Tokens (fonte: `tokens.css`)

Baseline: frontend `4a08dfc`. Os tokens vivem em [`src/styles/tokens.css`](https://github.com/purelifeministriesbrasil/frontend/blob/4a08dfc03ef6f5cc6adf907da5bfa454960a9add/src/styles/tokens.css); [`global.css`](https://github.com/purelifeministriesbrasil/frontend/blob/4a08dfc03ef6f5cc6adf907da5bfa454960a9add/src/styles/global.css) os importa e define aliases do Tailwind (`--color-plm-*`) em `@theme inline`.

| Grupo | Tokens |
|---|---|
| Superfícies | `--color-surface` `#f5f2ec`, `--color-surface-raised` `#ffffff`, `--color-surface-inverse` `#1c2530` |
| Marca | `--color-brand-primary` `#044a82`, `--color-brand-secondary` `#3b4c60`, `--color-brand-accent` `#c1bda6` |
| Texto | `--color-text` `#1c2530`, `--color-text-muted` `#575757`, `--color-text-on-dark` `#ffffff`, `--color-text-on-dark-muted` `#dedede` |
| Estado | `--color-focus` `#d99b26`, `--color-danger` `#b42318`, `--color-success` `#1d6f42`, `--color-border` (22% do texto) |
| Escala de texto | `--text-xs` 0.75rem até `--text-6xl` 3.75rem (xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl) |
| Layout | `--space-section: clamp(4rem, 8vw, 9rem)`, `--layout-max: 76rem` |

O hexadecimal `#d99b26` (dourado) está definido como cor de **foco** (`--color-focus`); não há token de botão dourado.

---

## 3. Tipografia

Os arquivos são fontes variáveis `.woff2` locais (`public/fonts/`), declaradas em [`fonts.css`](https://github.com/purelifeministriesbrasil/frontend/blob/4a08dfc03ef6f5cc6adf907da5bfa454960a9add/src/styles/fonts.css) com `font-display: swap` e pré-carregadas em [`BaseLayout.astro`](https://github.com/purelifeministriesbrasil/frontend/blob/4a08dfc03ef6f5cc6adf907da5bfa454960a9add/src/layouts/BaseLayout.astro).

| Família | Token / classe | Pesos | Uso |
|---|---|---|---|
| **Ruda** | `--font-display`, `.font-ruda` | 400–900 | Títulos e marca |
| **Montserrat** | `--font-body`, `.font-montserrat` | 300–800 | Corpo, botões, formulários, navegação |
| **Editorial** | `--font-editorial`, `.font-editorial` | do sistema | Pilha `Georgia, "Times New Roman", serif`: citações, versículos e destaques reflexivos |

!!! note "Sem Newsreader"
    Versões anteriores citavam a fonte Newsreader. Não há arquivo dessa fonte nem referência a ela no código; a família editorial é a pilha do sistema acima. O `@theme` do Tailwind também define `--font-baiti` (Mongolian Baiti, Georgia).

---

## 4. Componentes

### Botões ([`Button.astro`](https://github.com/purelifeministriesbrasil/frontend/blob/4a08dfc03ef6f5cc6adf907da5bfa454960a9add/src/components/ui/Button.astro))

Propriedade `variant` (padrão `primary`); renderiza `<a>` quando recebe `href`, caso contrário `<button>`.

| Variante | Classe | Aparência |
|---|---|---|
| `primary` | `.btn-primary` | Fundo azul da marca, texto branco; no hover escurece, sobe e brilha |
| `dark` | `.btn-dark` | Fundo `--color-surface-inverse`, texto branco; borda `#C1BDA6` no hover |
| `outline` | `.btn-outline` | Transparente com borda azul; preenche no hover |
| `outline-light` | `.btn-outline-light` | Transparente com borda/texto `#C1BDA6`, para fundos escuros |

Não existe variante dourada. Animações são desativadas sob `prefers-reduced-motion` (RNF-006).

### Outros componentes de interface

`Container`, `SectionHeading`, `SkipLink` e `Checkbox` (`components/ui/`). Estrutura completa em [Estrutura do Frontend](../architecture/frontend-structure.md).

### Menu móvel

O menu usa o elemento nativo `<dialog id="mobile-menu-dialog">` ([`mobile-nav.ts`](https://github.com/purelifeministriesbrasil/frontend/blob/4a08dfc03ef6f5cc6adf907da5bfa454960a9add/src/components/layout/mobile-nav.ts)), que fornece trap de foco, fechamento por `Esc` e retorno do foco ao botão. Atender a WCAG não foi auditado no repositório (ver [RNF-005](../requirements/non-functional.md)).
