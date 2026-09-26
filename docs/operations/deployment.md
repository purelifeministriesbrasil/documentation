# Guia Operacional de Deploy na Vercel

O frontend do portal Pure Life Ministries Brasil é hospedado na **Vercel** através de compilação estática pura no Astro 5.

---

## 1. Conexão do Repositório na Vercel

1. Acesse o painel da Vercel em [vercel.com](https://vercel.com).
2. Clique em **Add New...** > **Project**.
3. Importe o repositório GitHub: `purelifeministriesbrasil/frontend`.
4. Defina as configurações de build:
   - **Framework Preset**: `Astro`
   - **Root Directory**: `./` (ou selecione a pasta frontend se estiver em subdiretório)
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`

---

## 2. Injeção das Variáveis de Ambiente na Vercel

Na seção **Environment Variables**, adicione:

| Chave | Valor de Exemplo | Escopo |
| :--- | :--- | :--- |
| `PUBLIC_SITE_ORIGIN` | `https://purelifebrasil.org` | Production, Preview |
| `PUBLIC_SUPABASE_URL` | `https://[seu-projeto].supabase.co` | Production, Preview |
| `PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUz...` | Production, Preview |
| `PUBLIC_TURNSTILE_SITE_KEY` | `0x4AAAAAAA...` (Chave real da Cloudflare) | Production |

Clique em **Deploy**. A compilação estática será executada e o site estará ativo na CDN global em aproximadamente 15 segundos.

---

## 3. Configuração de Domínio Personalizado

1. No painel do projeto na Vercel, acesse **Settings** > **Domains**.
2. Digite o domínio institucional: `purelifebrasil.org`.
3. Configure os registros DNS no provedor autoritativo:
   - **Registro A**: apontando para o IP da Vercel (`76.76.21.21`).
   - **Registro CNAME** (`www`): apontando para `cname.vercel-dns.com`.
4. A Vercel provisionará automaticamente o certificado SSL/TLS gratuito da Let's Encrypt com renovação automática.
