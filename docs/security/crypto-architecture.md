# Arquitetura Criptográfica e Proteção em Repouso

Campos sensíveis são cifrados no Worker com **AES-256-GCM** e **AAD** antes de chegarem ao banco. A decisão está no [ADR-004](../adrs/ADR-004-criptografia-aes-gcm-aad.md); esta página descreve o que o código faz. Baseline auditada: backend `ca9737f`.

!!! info "Escopo da afirmação"
    Esta página descreve **controles técnicos implementados e testados**. Não é parecer jurídico nem garantia de que não existam outras falhas.

---

## 1. O que é cifrado e com qual contexto

Implementação: [`infrastructure/crypto/aes-gcm.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/crypto/aes-gcm.ts); contrato: [`application/ports/encryption-provider.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/application/ports/encryption-provider.ts).

| Entidade (`entityType`) | Campo (`field`) | Coluna de ciphertext / IV | Quem cifra |
|---|---|---|---|
| `triage_submission` | `contact`, `report` | `contact_ciphertext`/`contact_iv`, `report_ciphertext`/`report_iv` | [`unit-of-work.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/db/unit-of-work.ts) |
| `contact_submission` | `contact`, `message` | `contact_*`, `message_*` | [`contact-repository.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/db/contact-repository.ts) |
| `newsletter_subscription` | `email` | `email_cipher`/`email_iv` | [`newsletter-repository.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/db/newsletter-repository.ts) |
| `donation_intent` | `email` (opcional) | `donor_email_cipher`/`donor_email_iv` | [`donation-repository.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/db/donation-repository.ts) |

O campo `contact` da triagem e do contato é um JSON (`fullName`, `email`, `phone` e, na triagem, `profile`) cifrado como um único valor.

## 2. Formato armazenado

Não existe um pacote binário com `keyId`. Cada valor cifrado ocupa **colunas separadas**:

| Parte | Onde fica | Detalhe |
|---|---|---|
| Ciphertext + tag GCM | coluna `*_ciphertext` / `*_cipher` (Base64) | A tag de 128 bits fica ao final do ciphertext (saída da Web Crypto) |
| IV | coluna `*_iv` (Base64) | 12 bytes (96 bits) por `crypto.getRandomValues`, novo a cada cifragem; `decrypt` rejeita IV de outro tamanho (`crypto_iv_invalid`) |
| Versão da chave | coluna `key_version` (smallint) | Escolhe a chave na leitura |
| Algoritmo | constante no código | `AES-256-GCM`, `tagLength: 128` |

## 3. AAD: vínculo com o registro

O AAD é a string UTF-8:

```text
{entityType}:{entityId}:{field}:v{keyVersion}
# exemplo: triage_submission:0b1c…-uuid:report:v1
```

Copiar um ciphertext para outra linha, outra coluna ou outra versão faz a verificação da tag falhar na decifragem. Como o `entityId` precisa existir antes de cifrar, a triagem insere a linha, cifra e atualiza dentro da mesma transação; contato, newsletter e doação geram o UUID antes do `INSERT`.

## 4. Chaveiro e versões

- Variáveis `TRIAGE_KEY_V1`, `TRIAGE_KEY_V2`, … (Base64 de **exatamente 32 bytes**) formam o chaveiro; `TRIAGE_KEY_CURRENT_VERSION` escolhe a versão das **novas** cifras (padrão 1).
- A configuração é validada por requisição ([`env.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/config/env.ts), `readCryptoConfig`): chave ausente, Base64 inválido ou tamanho errado resulta em `503` com log só dos **nomes** das variáveis. O provedor também valida todas as chaves na construção.
- Procedimento de rotação e limites: [Rotação de Chaves](../operations/key-rotation.md). **Não há re-cifragem automática** de dados existentes.

## 5. HMAC e pepper (deduplicação)

[`hashing.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/crypto/hashing.ts) (`createKeyedHasher`) calcula **HMAC-SHA256** do e-mail (`trim` + minúsculas) com `HASH_PEPPER` (Base64, mínimo 32 bytes). O resultado é `email_hash` (newsletter) e `donor_email_hash` (doação). Trocar o pepper muda todos os hashes.

!!! note "Comentário histórico"
    O SQL de [`drizzle/0001_initial.sql`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/drizzle/0001_initial.sql) descreve `donor_email_hash` como "SHA-256 com pepper". O código usa HMAC-SHA256; a migration não pode ser editada (checksum).

Outros usos: `sha256Hex` (hash do token de confirmação da newsletter), `randomToken` (256 bits, Base64URL), `timingSafeEqual` e `hmacSha256Hex` (webhooks).

## 6. Falhas de decifragem

`decrypt` lança erro se a tag não confere (dado adulterado, AAD diferente, chave errada), se o IV é inválido (`crypto_iv_invalid`) ou se a versão da chave não está no chaveiro (`crypto_key_missing:v<n>`). O Worker não decifra dados de usuários; a leitura é feita pela [caixa pastoral](../operations/cli-cheatsheet.md#caixa-pastoral), que reimplementa a decifragem com o mesmo AAD em [`pastoral-inbox.mjs`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/scripts/pastoral-inbox.mjs).

## 7. Evidência de testes

| Teste | Cobre |
|---|---|
| [`tests/crypto.test.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/tests/crypto.test.ts) | Round-trip, AAD, chaveiro por versão, chave inválida |
| [`tests/canary.test.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/tests/canary.test.ts) | Dado sensível sentinela não aparece em e-mail nem em log |
| [`tests/integration.db.test.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/tests/integration.db.test.ts) | Colunas em claro não contêm o dado (requer `TEST_DATABASE_URL`) |

## 8. Limitações conhecidas

- Sem re-cifragem automática ao rotacionar; vazamento de chave exige procedimento manual.
- A chave e o pepper vivem como segredos do Worker e no cofre da organização; a custódia fora do repositório **não é verificável** aqui.
- Metadados não cifrados: `subject` do contato, `program_interest`, `contact_channel`, datas e status.
