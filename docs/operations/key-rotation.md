# Procedimento de Rotação de Chaves Criptográficas

A rotação de chaves de cifra e segredos de ambiente deve ocorrer a cada 90 dias ou imediatamente após qualquer suspeita de comprometimento de credencial.

---

## 1. Rotação da Chave Criptográfica de Triagem (`TRIAGE_KEY`)

O sistema suporta versionamento de chaves simétricas AES-256 (`keyId`), permitindo a inclusão de uma nova chave sem necessidade de desencriptar e re-encriptar imediatamente o histórico existente.

### Passo 1: Geração de Nova Chave Criptográfica
Gere 32 bytes de entropia pura codificados em Base64:

```bash
# Via OpenSSL
openssl rand -base64 32
```

### Passo 2: Atualização do Ambiente do Worker
No Cloudflare Workers ou no painel de segredos do backend:

```bash
# Adiciona a nova chave versão 2
npx wrangler secret put TRIAGE_KEY_V2
```

### Passo 3: Promoção da Chave Ativa
Atualize a variável `CURRENT_KEY_VERSION=2` na configuração do Worker. Todas as novas triagens passarão a ser encriptadas com a chave V2, enquanto as triagens antigas com `keyId=1` continuarão sendo lidas normalmente utilizando a chave V1 mantida no repositório de chaves.

---

## 2. Rotação das Chaves de API do Supabase

Caso a chave anônima ou a chave de serviço do Supabase seja exposta:

1. Acesse o painel do Supabase: `Project Settings` > `API`.
2. Em **Project API Keys**, localize o botão **Reset API Keys** (ou gere um novo JWT Secret).
3. Atualize imediatamente as variáveis `PUBLIC_SUPABASE_ANON_KEY` no painel da Vercel.
4. Dispare um novo build na Vercel para que as novas credenciais entrem em vigor.
