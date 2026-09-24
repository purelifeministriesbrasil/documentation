# Runbook: Rotação de Chaves Criptográficas e Custódia Segura

Guia operacional para rotação de chaves AES-256 e custódia segura conforme as seções §5.2 e §12.3 da Especificação Técnica v5.0.

## 1. Princípios de Custódia

1. **Localização em Produção**:
   - As versões ativas das chaves simétricas residem nos **Cloudflare Secrets** do Worker `purelife-api`, no formato `TRIAGE_KEY_V1`, `TRIAGE_KEY_V2`, etc.
2. **Cofre Físico / Digital de Segurança**:
   - Uma cópia de backup offline reside no cofre de senhas do Ministério (1Password / Bitwarden), com acesso restrito a **dois responsáveis formalmente nomeados** pela diretoria pastoral.
3. **Imutabilidade de Chaves Antigas**:
   - Chaves anteriores nunca são apagadas enquanto existirem registros históricos cifrados com a versão correspondente.
   - Chaves antigas operam em modo **apenas-leitura (decrypt-only)**; novas submissões utilizam estritamente a `currentVersion`.

---

## 2. Procedimento de Rotação Periódica (Anual)

### Passo 1: Geração da Nova Chave AES-256
Gere uma chave simétrica segura de 256 bits (32 bytes) codificada em Base64:

```bash
# Executado em ambiente local seguro e desconectado
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Passo 2: Armazenamento Seguro no Cofre
1. Salve a nova chave no cofre da organização com o identificador `TRIAGE_KEY_V<N>`.
2. Colete a assinatura/aprovação formal dos dois operadores responsáveis.

### Passo 3: Injeção na Cloudflare
Insira a nova chave no ambiente do Cloudflare Worker:

```bash
cd backend
wrangler secret put TRIAGE_KEY_V<N>
```

### Passo 4: Atualização da Versão Vigente no Worker
No arquivo `backend/src/index.ts`, atualize a versão padrão injetada na fábrica `createAesGcmProvider`:

```ts
const cryptoProvider = createAesGcmProvider(
  {
    1: env.TRIAGE_KEY_V1,
    2: env.TRIAGE_KEY_V2, // Nova versão
  },
  2 // Nova versão vigente
);
```

### Passo 5: Teste de Verificação em Homologação
1. Submeta uma nova triagem de teste em staging e verifique se o campo `key_version` foi gravado com o novo número de versão.
2. Realize a decifração controlada do registro gerado e de um registro com versão anterior, confirmando que a rotação manteve compatibilidade reversa.
