# Gestão de Conteúdo do Site

O site é estático (Astro): não há painel administrativo. Todo o conteúdo editável fica em poucos arquivos do
repositório `frontend`, separados do código das páginas. Depois de editar, abra um PR, aguarde o CI e publique
(ver [Runbook de Implantação](deployment.md#8-site-cloudflare-pages)).

!!! tip "Regra de ouro"
    O **site novo é a referência** de conteúdo. Ao encontrar uma informação divergente no site antigo, nas redes
    sociais ou em materiais impressos, confirme com a liderança antes de alterar o site.

---

## Onde editar cada informação

| O que | Arquivo (`frontend/`) | Observações |
|---|---|---|
| E-mail, WhatsApps, endereço | `src/lib/site-config.ts` → `contact` | WhatsApp pastoral `(61) 99566-1936`; WhatsApp do curso `+55 62 9119-1098` |
| Texto “Quem Somos” | `src/lib/site-config.ts` → `aboutParagraphs` | Usado na Home e em `/sobre/` |
| Canal do YouTube, vídeo em destaque, playlist das conferências | `src/lib/site-config.ts` → `social` e `media` | Os vídeos usam miniatura com link (sem player incorporado) |
| Curso (nome, instituição, duração, modalidade) | `src/lib/site-config.ts` → `course` | Temas e público em `src/pages/curso.astro` |
| Residencial (duração, inscrição, mensalidade) | `src/lib/site-config.ts` → `residentialProgram` | Inscrição R$ 500,00 só após entrevista e aprovação; mensalidade R$ 1.200,00 |
| Chave PIX e titular | `src/lib/site-config.ts` → `donation` | CNPJ 97.548.932/0001-05 |
| Programas exibidos (cards) | `src/data/programs.ts` | Programa Residencial e Online Vida Pura (Hotmart) |
| Depoimentos | `src/data/testimonials.ts` | Publique só com autorização por escrito do autor |
| Fotos e legendas do campus | `src/data/campus-photos.ts` + `src/assets/images/campus/` | Toda foto precisa de texto alternativo (`alt`) descritivo |
| Linha do tempo do ministério (`/sobre/`) | `src/data/timeline.ts` | Marcos do Brasil levam `brazil: true` |
| Viagem/Conferência EUA (datas, lotes, inclusos, FAQ, link de pagamento) | `src/data/usa-trip.ts` | Pagamento na plataforma da SEBI |
| Livros da Editora | `src/pages/editora.astro` → `books` | Capa real opcional em `src/assets/images/books/` |
| Perguntas frequentes | `src/pages/perguntas-frequentes.astro` e `src/components/home/FAQPreview.astro` | As duas listas devem ficar coerentes |
| Endereços antigos → novos | `public/_redirects` | Formato: `/caminho-antigo  /caminho-novo  301` |

---

## Imagens

- Coloque a **fonte em alta qualidade** (JPG, PNG ou WebP; até ~1600 px no maior lado) em `src/assets/images/`.
  O build gera AVIF e WebP em vários tamanhos; não otimize manualmente.
- Para trocar uma foto existente, **substitua o arquivo mantendo o nome**.
- Fotos com pessoas identificáveis exigem autorização de uso de imagem. Evite fotos de participantes do
  programa residencial sem consentimento expresso.
- A imagem de compartilhamento em redes sociais fica em `public/og-image.jpg` (1200×630 px).

## Textos e acessibilidade

- Escreva em português do Brasil, com frases curtas e sem jargão técnico.
- Todo link que abre outra aba deve ter `target="_blank" rel="noopener noreferrer"` e o aviso
  “(abre em nova aba)” para leitores de tela (`<span class="sr-only">`).
- Não use estilos inline (`style="…"`): o build falha, por causa da política de segurança de conteúdo (CSP).

## Validação antes do PR

```bash
cd frontend
pnpm ci:verify          # typecheck, build, CSP, topologia e ausência de estilos inline
```

Para revisar visualmente antes do merge, publique uma prévia:

```bash
cd backend
pnpm exec wrangler pages deploy ../frontend/dist --project-name purelife-site --branch revisao
# abre em https://revisao.purelife-site.pages.dev
```
