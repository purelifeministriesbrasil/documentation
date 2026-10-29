# Migração do Site Antigo (WordPress)

Até a virada do domínio, `purelifeministriesbrasil.org` é servido por um **WordPress** (tema Salient, WPBakery,
WooCommerce, GiveWP e WPForms) hospedado em servidor cloud gerenciado pela agência que construiu o site. Esta
página registra o que foi aproveitado, o que foi descartado e como fazer a transição sem quebrar links.

---

## 1. Inventário do site antigo (outubro de 2026)

| Área | Situação no WordPress | Destino no site novo |
|---|---|---|
| Home, Sobre, Contato | Páginas institucionais | Reescritas; o Sobre ganhou a **linha do tempo** do ministério |
| Residencial | Página com “dados básicos” e depoimentos | `/programas/residencial/` |
| Vencedores em Casa | Programa online por trimestre | Card **Online Vida Pura** (inscrição pela Hotmart) |
| Para Esposas | Programa em “lançamento em breve” | Não exibido como programa (decisão da diretoria) |
| Aconselhamento Suplementar | Página informativa | Não migrado; interessados usam o Contato |
| Agenda de Conferência | Formulário para igrejas | Redirecionado para o Contato com o assunto “Conferência” |
| Cursos (WooCommerce) | Pós-graduação e Capacitação | Página `/curso/` com a **Formação Superior Sequencial em Sexualidade Humana sob Perspectiva Bíblica** |
| Livro “Pilha de Máscaras” | Produto WooCommerce (R$ 50) | Editora, com capa real e autor Dustin Renz |
| Vídeos | Página com vídeos do YouTube | Seção de mídias da Home |
| Linha do tempo (TimelineJS) | Iframe externo | Componente próprio, acessível e sem iframe |
| Doações (GiveWP + PagSeguro da SEBI) | Formulário de doação | Página `/doar/` com a chave PIX do CNPJ |
| Landing pages da Viagem EUA | HTML estático com lotes e link da SEBI | Página `/viagem-eua/` com os dados de 2027 |

## 2. Dados pessoais do site antigo

O banco do WordPress contém dados pessoais (clientes da loja, pedidos, registros de doação, inscritos da
newsletter e usuários). Por decisão da diretoria, **nenhum desses dados foi importado nem é mantido** no
ecossistema novo:

- as análises do backup foram feitas apenas com contagens, sem exibir dados pessoais, e as cópias extraídas
  foram apagadas;
- o backup recebido da agência deve ser descartado de forma segura após a virada;
- a senha de administrador do WordPress que acompanhou o backup deve ser trocada (ou a instalação desativada).

## 3. Redirecionamentos 301

O arquivo `frontend/public/_redirects` leva cada endereço antigo para a página equivalente, preservando links
compartilhados e a posição nos buscadores. Cada caminho vale com e sem barra final.

| Endereço antigo | Destino |
|---|---|
| `/sobre-nos/`, `/home-principal/` | `/sobre/`, `/` |
| `/residencial/`, `/curso/residencial/` | `/programas/residencial/`, `/triagem/` |
| `/vencedores-em-casa/`, `/para-esposas/`, `/curso/vencedores-em-casa/` | `/programas/` |
| `/perguntas-frequentes-*/` | `/perguntas-frequentes/` |
| `/contato-t/`, `/programa-de-aconselhamento-suplementar/` | `/contato/` |
| `/agenda-de-conferencia/` | `/contato/?assunto=Conferencia` |
| `/doacao/`, `/a-doacao-falhou/`, `/donor-dashboard/` | `/doar/` |
| `/confirmacao-da-doacao/` | `/doar/obrigado/` |
| `/curso/pos-graduacao-…/`, `/curso/capacitacao-…/`, `/cursos-e-conferencias/` | `/curso/` |
| `/conferencia-pure-life-ministries-brasil/`, `/viagem-purelife-ministries-brasil/`, `/40-anos-purelife-ministries/` | `/viagem-eua/` |
| `/videos/` | `/#midias` |
| `/produto/*`, `/product/*` | `/editora/` |
| `/carrinho/`, `/finalizar-compra/`, `/minha-conta/`, `/blog/` | `/` |

## 4. Infraestrutura da transição

| Item | Valor |
|---|---|
| Registrador | eNom (provavelmente via revendedor); vencimento em 16/08/2027; DNSSEC desligado |
| Nameservers antigos | `jaxson.ns.cloudflare.com`, `selah.ns.cloudflare.com` (conta Cloudflare da agência) |
| Nameservers novos | `ivy.ns.cloudflare.com`, `tanner.ns.cloudflare.com` (conta Cloudflare do ministério) |
| Origem do WordPress | `158.69.199.156` (registro `A @`, com proxy, na zona nova) |
| E-mail do domínio | Zoho Mail (MX, SPF e DKIM preservados na zona nova) |

Sequência completa: [Runbook de Implantação, etapas 9 a 12](deployment.md#9-zona-dns-e-troca-de-nameservers).
