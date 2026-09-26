# Design System & Identidade Visual

O Design System da Pure Life Ministries Brasil foi projetado para transmitir **reverência, acolhimento, solidez doutrinária e excelência visual**, combinando tradição clássica com tecnologias modernas de interface web.

---

## 1. Paleta de Cores Institucional

A paleta de cores reflete a herança litúrgica cristã e a sobriedade necessária ao ministério de restauração:

| Nome do Token | Valor Hex | Amostra | Finalidade Principal |
| :--- | :---: | :---: | :--- |
| **Royal Blue** | `#044A82` | <span style="background-color:#044A82;display:inline-block;width:24px;height:24px;border-radius:4px;"></span> | Cor primária institucional, botões de ação e cabeçalhos |
| **Midnight Graphite** | `#1C2530` | <span style="background-color:#1C2530;display:inline-block;width:24px;height:24px;border-radius:4px;"></span> | Fundo de cabeçalhos, rodapé, superfícies escuras e diálogos |
| **Golden Crown** | `#D99B26` | <span style="background-color:#D99B26;display:inline-block;width:24px;height:24px;border-radius:4px;"></span> | Acentos, foco acessível, badges e destaques solenes |
| **Parchment Sand** | `#C1BDA6` | <span style="background-color:#C1BDA6;display:inline-block;width:24px;height:24px;border-radius:4px;"></span> | Subtítulos elegantes, bordas suaves e detalhes litúrgicos |
| **Clean White** | `#FFFFFF` | <span style="background-color:#FFFFFF;display:inline-block;width:24px;height:24px;border-radius:4px;border:1px solid #ccc;"></span> | Fundo de cartões no modo claro e texto principal em áreas escuras |
| **Slate Border** | `#3B4C60` | <span style="background-color:#3B4C60;display:inline-block;width:24px;height:24px;border-radius:4px;"></span> | Divisores sutis e linhas de separação |

---

## 2. Tipografia Oficial

A tipografia é baseada em fontes variáveis otimizadas no formato `.woff2`, pré-carregadas para evitar FOIT (Flash of Invisible Text):

1. **Ruda** (`font-ruda`): Tipografia sans-serif robusta, de alta legibilidade, utilizada nos títulos principais (`h1`, `h2`, `h3`) e no logotipo da marca.
2. **Montserrat** (`font-montserrat`): Tipografia geométrica contemporânea, utilizada no corpo de texto, botões, formulários e navegação.
3. **Editorial / Newsreader** (`font-editorial`): Tipografia serifada clássica, utilizada em versículos bíblicos, citações pastorais e destaques reflexivos.

---

## 3. Componentes e Micro-interações

### Botões (`Button.astro`)
- **Variante Primária**: Fundo `#044A82`, texto branco, cantos arredondados, hover com elevação suave (`transform: translateY(-2px)`).
- **Variante Dourada**: Fundo `#D99B26`, texto escuro, alto contraste para chamadas de ação primárias (ex: "Inscreva-se").
- **Variante Contorno (Outline)**: Borda `#C1BDA6`, fundo transparente, hover preenchido.

### Diálogo Nativo de Acessibilidade (`<dialog>`)
O menu de navegação em telas móveis utiliza a tag nativa HTML5 `<dialog id="mobile-menu-dialog">`, proporcionando:
- Foco automático com fechamento nativo via tecla `ESC`.
- Bloqueio de scroll de fundo (*backdrop blur*).
- Plena conformidade com tecnologias assistivas e leitores de tela (WCAG 2.2 AA).
