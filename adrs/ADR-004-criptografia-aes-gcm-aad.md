# ADR-004 — Criptografia de Campo em Repouso com AES-256-GCM e AAD Rígido

## Status
Aprovado (§5.2 da Especificação Canónica v5.0).

## Contexto
O ecossistema armazena relatos de pecado sexual, confissões pastorais íntimas e contatos pessoais de pessoas que buscam restauração. Criptografia padrão sem autenticação de contexto (como AES-CBC simples ou AES-GCM sem dados autenticados adicionais) permite ataques nos quais um agente malicioso com privilégios de escrita no banco poderia:
1. Trocar o ciphertext do relato de um usuário com o de outro.
2. Trocar o ciphertext do relato confidencial com o campo de contato público.
3. Decifrar dados utilizando versões de chave obsoletas ou incorretas.

## Decisão
1. **Algoritmo**: Utilização de **AES-256-GCM** nativo via Web Crypto API (`crypto.subtle`), com tag de autenticação de 128 bits e IV aleatório de 12 bytes gerado por mensagem (`crypto.getRandomValues`).
2. **Dados Autenticados Adicionais (AAD)**: Toda operação de cifra e decifra **obrigatoriamente** amarra o ciphertext ao seguinte contexto canónico:
   ```text
   ${entityType}:${entityId}:${field}:v${keyVersion}
   ```
   - `entityType`: Tipo da entidade (ex.: `triage_submission`, `contact_submission`).
   - `entityId`: Identificador UUID da linha na tabela.
   - `field`: Nome do campo de destino (ex.: `contact`, `report`).
   - `keyVersion`: Versão numérica da chave criptográfica.
3. **Ordem Operacional no Unit of Work**:
   - A linha preliminar é inserida para obter o `entityId` real.
   - Os campos sensíveis são cifrados vinculados ao ID real no AAD.
   - A linha é atualizada com os ciphertexts dentro da **mesma transação de banco**.

## Consequências
- **Positivas**:
  - Imutabilidade contextual: qualquer tentativa de transferir ciphertexts entre registros ou entre colunas quebra o Authentication Tag e falha a decifração.
  - Detecção imediata de adulteração maliciosa ou corrupção de dados.
- **Trade-offs**:
  - Exige duas instruções SQL (`INSERT` seguido de `UPDATE` dos ciphertexts) executadas dentro da mesma transação atómica.
