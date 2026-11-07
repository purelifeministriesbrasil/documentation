# ADR-004: Criptografia de Campo em Repouso com AES-256-GCM e AAD

- **Status**: Aprovado (vigente; detalhes de implementação atualizados abaixo)
- **Data**: 2026-09-24
- **Decisores**: Equipe de Engenharia Pure Life Ministries Brasil


!!! info "Situação atual da implementação (auditoria de 07/11/2026)"
    A decisão (AES-256-GCM com AAD, IV aleatório de 96 bits, tag de 128 bits, chaveiro versionado) continua vigente.
    Os itens 4 e 5 da seção 2 foram escritos antes da implementação e diferem dela em detalhes:

    - O AAD **não** é só o `id`: é `entityType:entityId:field:v<versão>`
      ([`aes-gcm.ts`](https://github.com/purelifeministriesbrasil/backend/blob/ca9737fb48cdcad70b7bfddfd9cb76ea65fd1e7d/src/infrastructure/crypto/aes-gcm.ts)).
    - Não existe `keyId` no pacote: ciphertext e IV ficam em colunas Base64 separadas e a versão em `key_version`.

    Ver [Arquitetura Criptográfica](../security/crypto-architecture.md).

---

## 1. Contexto e Motivação

O formulário de triagem confidencial da Pure Life Ministries Brasil coleta relatos confessionais e dados de saúde espiritual/emocional altamente sensíveis. Sob os ditames do **Artigo 11 da Lei Geral de Proteção de Dados (LGPD)** e do sigilo pastoral cristão, dados sensíveis não podem residir desprotegidos em texto plano no banco de dados.

Em caso de violação de banco ou vazamento acidental de dumps, os dados sensíveis devem permanecer matematicamente inacessíveis a agentes não autorizados.

---

## 2. Decisão

Adotar cifra autenticada **AES-256-GCM** (Galois/Counter Mode) com dados associados adicionais (**AAD - Additional Authenticated Data**):

1. **Chave Simétrica de 256 bits**: Gerada criptograficamente via gerador pseudo-aleatório seguro (CSPRNG).
2. **IV (Initialization Vector) Único de 96 bits (12 bytes)**: Gerado aleatoriamente para cada operação de encriptação, nunca reutilizado sob a mesma chave.
3. **Autenticação de Integridade (Tag de 128 bits)**: Garante detecção imediata de qualquer adulteração nos dados criptografados.
4. **AAD Obrigatório**: Vincula o identificador do assistido (`id` UUID) ao ciphertext, impedindo ataques de corte-e-colagem de blocos encriptados entre diferentes registros.
5. **Versionamento de Chaves (`keyId`)**: Suporte nativo à rotação de chaves sem downtime ou corrupção de registros históricos.

---

## 3. Alternativas Rejeitadas

- **AES-256-CBC com PKCS#7**: Rejeitado por suscetibilidade a ataques de *padding oracle* e necessidade de camada separada de HMAC para autenticação.
- **Criptografia nativa em nível de disco (TDE)**: Rejeitado por ser insuficiente de forma isolada; se o banco estiver comprometido por injeção ou privilégio administrativo, o TDE entrega o texto plano.
- **RSA-4096 (Criptografia Assimétrica)**: Rejeitado pelo alto custo computacional e limitação estrita de tamanho de payload para relatos longos de triagem.

---

## 4. Consequências

### Impactos Positivos:
- **Proteção Total contra Dumps**: Arquivos de dump ou vazamentos de tabela não expõem relatos pastorais em texto legível.
- **Conformidade Estrita com LGPD**: Blindagem jurídica e institucional do ministério e dos assistidos.
- **Detecção de Fraude**: Tentativas de manipular bits do ciphertext resultam em rejeição imediata da tag de autenticação GCM.
