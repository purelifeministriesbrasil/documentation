# Diagramas de Sequência e Fluxos Canónicos

**Especificação Visual de Interações entre Subsistemas**  
**Versão:** 1.0.0  
**Classificação:** Arquitetura de Software e Engenharia de Borda  
**Notação:** Mermaid Sequence Diagrams (v10+)

---

## 1. Fluxo 1: Submissão de Triagem Confidencial e Cifra com AAD

O diagrama a seguir descreve a jornada ponta a ponta desde o preenchimento do formulário no navegador do aconselhando até a persistência cifrada em repouso no Neon Postgres, garantindo que o relato confidencial jamais seja gravado em texto plano no banco de dados.

```mermaid
sequenceDiagram
    autonumber
    actor Candidato as Candidato à Restauração
    participant Navegador as purelife-web (Astro Island)
    participant Edge as Cloudflare Borda (WAF/Headers)
    participant Worker as purelife-api (Worker)
    participant Crypto as Web Crypto Engine (AES-GCM)
    participant Neon as Neon Postgres (Serverless)

    Candidato->>Navegador: Preenche dados biográficos e relato íntimo
    Candidato->>Navegador: Marca checkboxes de consentimento Art. 11 LGPD
    Candidato->>Navegador: Clica em "Enviar Triagem com Sigilo"

    Navegador->>Edge: POST /api/forms/triagem (JSON + Turnstile Token)
    Edge->>Edge: Inspeciona Rate Limit (3 req/h) & Valida Turnstile
    Edge->>Worker: Encaminha requisição autenticada na borda

    Worker->>Worker: Valida payload via Zod triageSubmissionSchema.strict()
    Note over Worker: Gera UUIDv7 exclusivo para a triagem

    Worker->>Crypto: Cifrar relato usando chave TRIAGE_ENCRYPTION_KEY_V1
    Note over Crypto: AAD = "triage:" + triagem_id + ":report:v1"<br/>IV aleatório de 12 bytes gerado via CSPRNG
    Crypto-->>Worker: Retorna Ciphertext e Tag de Autenticação GCM

    Worker->>Neon: Inicia Transação SQL Atômica (Unit of Work)
    Neon->>Neon: INSERT INTO TriagemConfidencial (campos cifrados + IV)
    Neon->>Neon: INSERT INTO triage_consents (versao_termo, timestamp, ip_hash)
    Neon-->>Worker: Confirma gravação atômica (COMMIT)

    Worker-->>Edge: Retorna 201 Created {"success": true, "referenceCode": "PLM-109283"}
    Edge-->>Navegador: Resposta com Cache-Control: no-store, private
    Navegador->>Navegador: Destrói formulário e limpa variáveis da memória
    Navegador-->>Candidato: Exibe tela de confirmação com orientações pastorais
```

---

## 2. Fluxo 2: Inscrição em Pós-Graduação com Upload Seguro no Cloudflare R2

O processo de envio do diploma de graduação para a pós-graduação utiliza URLs pré-assinadas com controle de acesso privado, impedindo a sobrecarga da API do Worker com tráfego de arquivos pesados.

```mermaid
sequenceDiagram
    autonumber
    actor Aluno as Aluno Candidato
    participant Web as purelife-web (Checkout Island)
    participant Worker as purelife-api (Worker)
    participant R2 as Cloudflare R2 Bucket (Privado)
    participant Neon as Neon Postgres

    Aluno->>Web: Seleciona Pós-Graduação e anexa diploma (PDF até 5MB)
    Web->>Web: Valida formato MIME e computa hash SHA-256 local
    Web->>Worker: POST /api/courses/presigned-upload (metadata do arquivo)

    Worker->>Worker: Valida autorização e permissões acadêmicas
    Worker->>R2: Solicita URL pré-assinada de upload (TTL: 10 minutos)
    R2-->>Worker: Retorna Presigned Upload URL com chave UUID privada
    Worker-->>Web: Retorna Presigned URL e identificador de documento

    Web->>R2: PUT direto do arquivo PDF com assinatura prévia
    R2-->>Web: 200 OK (Upload concluído no bucket seguro)

    Web->>Worker: POST /api/courses/enroll (id_aluno, id_documento, hash_sha256)
    Worker->>Neon: Registra Inscrição com status "PENDENTE_DOCUMENTACAO"
    Neon-->>Worker: Confirmação de inscrição
    Worker-->>Web: 201 Created (Instruções de pagamento e matrícula)
    Web-->>Aluno: Exibe confirmação e aguarda homologação acadêmica
```

---

## 3. Fluxo 3: Doação via Pix e Conciliação Idempotente de Webhook

O fluxo a seguir ilustra a geração do Pix dinâmico e o processamento do webhook financeiro com trava de transação atômica (`pg_try_advisory_xact_lock`), evitando processamento duplicado mesmo sob rajadas de requisições idênticas da rede.

```mermaid
sequenceDiagram
    autonumber
    actor Doador as Doador Mantenedor
    participant Web as purelife-web (Doação Island)
    participant Worker as purelife-api (Worker)
    participant Gateway as Gateway de Pagamento (Asaas)
    participant Neon as Neon Postgres
    participant Mailer as Serviço de E-mail Transacional

    Doador->>Web: Seleciona valor da doação (ex.: R$ 150,00)
    Web->>Worker: POST /api/donations/create-pix (Idempotency-Key)
    Worker->>Gateway: POST /v3/payments (Cria cobrança Pix)
    Gateway-->>Worker: Retorna payload Pix (QRCode + Copia e Cola)
    Worker->>Neon: Salva registro Doacao (status = "AGUARDANDO_PAGAMENTO")
    Worker-->>Web: Retorna dados Pix para exibição imediata
    Web-->>Doador: Renderiza QR Code na tela com expiração de 15 min

    Note over Doador,Gateway: Doador efetua o pagamento no aplicativo do seu banco
    Gateway->>Worker: POST /api/webhooks/payment (Assinatura HMAC-SHA256)
    Worker->>Worker: Valida assinatura HMAC em tempo constante

    Worker->>Neon: Inicia Transação com pg_try_advisory_xact_lock(transacao_id)
    alt Lock Adquirido com Sucesso (Primeira Execução)
        Neon->>Neon: UPDATE Doacao SET status = 'CONFIRMADA', data_compensacao = NOW()
        Neon-->>Worker: Transação confirmada com sucesso
        Worker->>Mailer: Dispara e-mail de agradecimento e comprovante eclesiástico
        Worker-->>Gateway: Retorna 200 OK
    else Lock Ocupado ou Transação já Confirmada (Webhook Duplicado)
        Neon-->>Worker: Retorna falso ou registro já em status 'CONFIRMADA'
        Worker-->>Gateway: Retorna 204 No Content imediatamente (Idempotente)
    end
```

---

## 4. Fluxo 4: Rotina Diária Noturna de Expurgo Criptográfico Temporal

Em cumprimento estrito aos princípios da necessidade e da minimização da LGPD (Art. 16, I), uma rotina cron disparada pelo Cloudflare Worker executa a destruição criptográfica irreversível de triagens não convertidas após 180 dias.

```mermaid
sequenceDiagram
    autonumber
    participant Cron as Cloudflare Cron Trigger (03:00 UTC)
    participant Worker as purelife-api (Scheduled Handler)
    participant Neon as Neon Postgres
    participant Audit as LogAuditoriaAcesso (Insert-Only)

    Cron->>Worker: Dispara evento scheduled(event)
    Worker->>Neon: SELECT id, data_submissao FROM TriagemConfidencial<br/>WHERE status = 'RECEBIDA_PENDENTE' AND data_submissao < NOW() - INTERVAL '180 days'
    Neon-->>Worker: Retorna lote de triagens expiradas (ex.: 12 registros)

    loop Para Cada Triagem Expirada
        Worker->>Neon: Inicia Transação de Expurgo
        Neon->>Neon: UPDATE TriagemConfidencial SET<br/>relato_cifrado = NULL,<br/>historico_cifrado = NULL,<br/>status = 'EXPURGADA_LGPD',<br/>data_expurgo = NOW()<br/>WHERE id = triagem_id
        Neon->>Audit: INSERT INTO LogAuditoriaAcesso<br/>(operador = 'SYSTEM_CRON', acao = 'PURGE_LGPD', id_registro = triagem_id)
        Neon-->>Worker: Confirma expurgo da linha
    end

    Worker-->>Cron: Rotina concluída (Registra métrica de conformidade)
```
