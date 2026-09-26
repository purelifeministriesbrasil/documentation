# Regras de Negócio (RNs) & Governança Pastoral

Conjunto de diretrizes mandatórias que orientam o tratamento de dados, limites operacionais e políticas éticas do ministério.

---

## 1. Proteção de Dados Sensíveis & Privacidade

### RN-001: Sigilo Pastoral Inviolável (LGPD Art. 11)
* **Regra:** Relatos de aconselhamento, confissões espirituais, histórico de pecados de controle e notas pastorais são classificados como dados ultrassensíveis.
* **Aplicação:** Devem ser cifrados em repouso com algoritmo AES-256-GCM. A chave mestra nunca é exposta no cliente público.
* **Exceção:** Comunicações obrigatórias por lei em situações de iminente risco à integridade física de menores ou terceiros vulneráveis, conforme protocolo jurídico institucional.

### RN-002: Expurgo Automático de Triagens Inativas (180 Dias)
* **Regra:** Solicitações de triagem que permaneçam sem atendimento, canceladas ou concluídas há mais de 180 dias devem ser destruídas de forma irreversível do banco de dados.
* **Aplicação:** Execução diária automatizada por cron trigger (`0 3 * * *`) no Worker da Cloudflare.

### RN-003: Restrição Estrita de Maioridade Legal (18+ Anos)
* **Regra:** A submissão autônoma de triagem é permitida exclusivamente para indivíduos civilmente capazes (maiores de 18 anos).
* **Aplicação:** O formulário de triagem implementa uma etapa de confirmação de maioridade obrigatória (*age-gate*). Menores de 18 anos devem ser encaminhados para acompanhamento presencial com os pais ou responsáveis legais.

---

## 2. Integridade Operacional e Financeira

### RN-004: Idempotência de Pagamentos e Webhooks
* **Regra:** Nenhuma notificação de confirmação de PIX pode ser processada mais de uma vez, mesmo em caso de retentativas insistentes do gateway bancário.
* **Aplicação:** Utilização de lock consultivo transacional (`pg_try_advisory_xact_lock`) associado ao identificador único da transação.

### RN-005: Limite Rígido de Submissão de Payload
* **Regra:** Para mitigar ataques de negação de serviço e sobrecarga de memória, todas as submissões públicas possuem limite máximo inegociável de tamanho:
  * Formulários de Triagem e Contato: **máximo de 8 KB**.
  * Intenções de Doação PIX: **máximo de 4 KB**.

### RN-006: Higienização de Logs (Zero PII em Telemetria)
* **Regra:** Nenhum dado pessoal identificável (nome, e-mail, telefone, relato, token bancário ou cookie) pode ser registrado em logs da Cloudflare, Vercel ou plataformas de APM.
* **Aplicação:** O módulo `scrubber.ts` substitui automaticamente campos confidenciais por `[REDACTED]` antes de qualquer emissão de log.
