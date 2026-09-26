# Arquitetura Criptográfica e Proteção em Repouso

A proteção de dados sensíveis na Pure Life Ministries Brasil emprega padrões criptográficos autenticados internacionalmente reconhecidos, especificamente **AES-256-GCM** com Dados Associados Adicionais (**AAD**).

---

## 1. Estrutura do Pacote Criptográfico

Cada campo sensível encriptado é estruturado conforme a seguinte anatomia:

```
+---------------+-------------------+-----------------------------------+--------------------+
| keyId (1 byte)|  IV (12 bytes)    |       Ciphertext (N bytes)        |   Tag (16 bytes)   |
+---------------+-------------------+-----------------------------------+--------------------+
```

- **`keyId`**: Identificador numérico da versão da chave que originou a cifra, permitindo rotação transparente sem re-encriptação imediata de todo o banco.
- **`IV` (Initialization Vector)**: Vetor de 96 bits gerado via `crypto.getRandomValues()`. Cada encriptação possui um IV único e irrepetível.
- **`Ciphertext`**: O texto confessional encriptado com a chave simétrica de 256 bits.
- **`Tag` de Autenticação**: Tag GCM de 128 bits que atesta que o ciphertext não sofreu alteração nem truncamento.

---

## 2. Ligação Criptográfica com AAD (Additional Authenticated Data)

Para impedir o ataque de *ciphertext transplantation* (onde um invasor copia o bloco encriptado de um assistido e cola no registro de outro assistido), o identificador único do registro (`id` UUID) é fornecido como AAD durante a encriptação e desencriptação:

$$\text{Tag} = \text{GHASH}_{H}(\text{AAD} \mathbin{\Vert} \text{Ciphertext})$$

Se qualquer agente tentar associar o ciphertext a outro registro ou ID diferente, a validação da Tag GCM falha imediatamente, lançando erro de integridade e abortando a operação.

---

## 3. Gestão e Custódia de Chaves

- **Chaves em Memória**: As chaves simétricas residem exclusivamente nas variáveis de ambiente seguras dos Workers e funções de servidor, nunca trafegando pelo navegador cliente.
- **Rotação Contínua**: A inclusão de uma nova chave `TRIAGE_KEY_V2` não invalida os dados encriptados com `TRIAGE_KEY_V1`. O sistema detecta o `keyId` no cabeçalho do payload e seleciona a chave correta para leitura.
