# DNS, E-mail e Borda (Cloudflare)

Configuração de produção do domínio `purelifeministriesbrasil.org` na conta Cloudflare do ministério (plano
Free), conferida em 21/11/2026. Serve de referência para auditar a zona e para recriá-la, se preciso.

## 1. Zona DNS

| Tipo | Nome | Destino / conteúdo | Proxy | Para quê |
|---|---|---|---|---|
| `CNAME` | `@` (raiz) | `purelife-site.pages.dev` | Sim | Site no Cloudflare Pages |
| `CNAME` | `www` | `purelife-site.pages.dev` | Sim | Site; redireciona para a raiz (ver §3) |
| Worker (domínio) | `api` | Worker `purelife-api` | Sim | API, associada pelo workflow **Deploy API** (destino `domain`) |
| `MX` | `@` | `mx.zoho.com` (10), `mx2.zoho.com` (20), `mx3.zoho.com` (50) | — | E-mail do domínio (Zoho), preservado do DNS antigo |
| `TXT` | `@` | `v=spf1 include:zohomail.com ~all` | — | SPF do Zoho |
| `TXT` | `zmail._domainkey` | `v=DKIM1; k=rsa; p=…` | — | DKIM do Zoho |
| `TXT` | `resend._domainkey` | `p=…` | — | DKIM do Resend |
| `CNAME` | `send`, `rsend` | Hosts de envio do Resend | **Não** (só DNS) | Retorno e SPF do Resend |
| `TXT` | `_dmarc` | `v=DMARC1; p=none;` | — | DMARC em modo de observação |

!!! warning "Registros do Resend não podem ter proxy"
    `send` e `rsend` ficam em **DNS only**. Com proxy, a verificação do Resend falha.

- **SSL/TLS:** modo *Completo* (Full). Não rebaixe para *Flexível*.
- **DNSSEC:** desligado até a transferência do registro para a Cloudflare; depois, ligar (Cloudflare → DNS →
  Configurações).
- **Registro do domínio:** a consulta RDAP lista a eNom, mas a administração é feita pelo painel de domínios da
  Locaweb. Vence em 16/08/2027. O plano de transferência para a Cloudflare está em
  [Migração do Site Antigo](legacy-migration.md).

## 2. E-mail transacional (Resend)

A API envia dois tipos de e-mail pelo Resend, sempre de `EMAIL_FROM` (endereço de envio, sem caixa de
entrada):

| E-mail | Destinatário | Conteúdo |
|---|---|---|
| Confirmação da newsletter | Quem se inscreveu | Botão de confirmação, link de cancelamento, validade de 48 h |
| Avisos à equipe (contato, triagem, alertas de expurgo) | `STAFF_NOTIFICATION_EMAIL` | Somente o código de referência; **nunca** dados pessoais (US-5.5) |

### Identidade visual

Os modelos ficam em `backend/src/application/emails/templates.ts` (funções puras que devolvem `{ text, html }`):

- layout em tabelas e estilos inline (compatível com Gmail e Outlook), largura de 600 px, adaptável ao celular
  e legível no modo escuro;
- cabeçalho azul institucional (`#044A82`) com o logotipo branco, faixa marfim (`#C1BDA6`), botão azul, rodapé
  com o endereço do campus e o site;
- todo texto dinâmico passa por `escapeHtml`; a versão em texto simples acompanha sempre o HTML;
- o logotipo é um **PNG** publicado pelo site em `/email/logo-plm-branca.png` (WebP e SVG não são confiáveis em
  e-mail). Os arquivos ficam em `frontend/public/email/`; trocar o logotipo exige regerar esse PNG.

Para alterar um texto ou cor, edite `templates.ts`, rode `pnpm test` (há testes em
`tests/email-templates.test.ts`) e publique a API pelo Deploy API. Para ver o resultado sem usar um cliente
real, abra o e-mail enviado em *Resend → Emails* (aba **Preview**).

## 3. Regras na borda

| Regra | Onde | Configuração |
|---|---|---|
| `www` → raiz | *Rules → Redirect Rules* (modelo "Redirecionar de WWW para a raiz") | `https://www.*` → `https://${1}`, **301**, preserva a query string |
| Limite por IP na API | *Security → Security rules → Rate limiting* | Expressão `http.host eq "api.purelifeministriesbrasil.org" and starts_with(http.request.uri.path, "/api/")`; **30 pedidos por 10 s**; ação **Bloquear** por 10 s |

O limite da Cloudflare **complementa** o do Worker (`RATE_LIMIT_MODE = "enforce"`, binding nativo
`[[ratelimits]]`): o do Worker conta por endpoint; o da borda corta rajadas antes de chegarem ao Worker. No
plano Free só existe **uma** regra de rate limiting e o período fixo é 10 s.

## 4. Verificação rápida

```bash
nslookup -type=NS purelifeministriesbrasil.org 1.1.1.1     # ivy e tanner
curl -sI https://www.purelifeministriesbrasil.org/sobre/    # 301 para https://purelifeministriesbrasil.org/sobre/
curl -sI https://api.purelifeministriesbrasil.org/          # 302 para o site (a raiz da API redireciona ao site)
./go-live-final.sh verify                                    # 7 verificações sem alterar dados
```
