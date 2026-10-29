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
* **Comportamento implementado (2026-10-13):** o expurgo usa `retention_until = criação + 180 dias` e **não considera o status** — uma triagem ainda em atendimento também é expurgada no prazo. O registro é nulificado (código, canal, programa, ciphertexts e IVs) e marcado `purged`; `created_month` permanece apenas para métricas agregadas.

!!! success "Aprovada pela liderança pastoral (2026-10-15)"
    O prazo fixo de 180 dias a partir do envio, independentemente do status, foi confirmado. Atendimentos que precisem de registro por mais tempo devem ser documentados fora do sistema, conforme o protocolo pastoral.

### RN-002-A: Retenção de Mensagens de Contato (180 Dias)
* **Regra:** Mensagens do formulário de contato institucional são retidas por 180 dias a partir do envio.
* **Aplicação:** Mesmo cron da RN-002; dados de contato e mensagem são nulificados e o registro marcado `purged` (CHECK `contact_purged_clean`).

### RN-003: Restrição Estrita de Maioridade Legal (18+ Anos)
* **Regra:** A submissão autônoma de triagem é permitida exclusivamente para indivíduos civilmente capazes (maiores de 18 anos).
* **Aplicação:** O formulário de triagem implementa uma etapa de confirmação de maioridade obrigatória (*age-gate*). Menores de 18 anos devem ser encaminhados para acompanhamento presencial com os pais ou responsáveis legais.

---

## 2. Integridade Operacional e Financeira

### RN-004: Idempotência de Pagamentos e Webhooks
* **Regra:** Nenhuma notificação de confirmação de PIX pode ser processada mais de uma vez, mesmo em caso de retentativas insistentes do gateway bancário.
* **Aplicação:** Cada evento é registrado em `payment_webhook_events` com chave única (provedor + ID do evento) e reivindicado por um *lease* de 60 segundos (`INSERT … ON CONFLICT DO UPDATE` condicional), com no máximo 5 tentativas. Reenvios de um evento já processado respondem `200 duplicate`; uma doação `confirmed` nunca regride.

### RN-005: Limite Rígido de Submissão de Payload
* **Regra:** Para mitigar ataques de negação de serviço e sobrecarga de memória, todas as submissões públicas possuem limite máximo inegociável de tamanho:
  * Formulários de Triagem e Contato: **máximo de 8 KB**.
  * Intenções de Doação PIX: **máximo de 4 KB**.
  * Inscrição na newsletter: **máximo de 1 KB**; confirmação: **máximo de 256 bytes**.

### RN-006: Higienização de Logs (Zero PII em Telemetria)
* **Regra:** Nenhum dado pessoal identificável (nome, e-mail, telefone, relato, token bancário ou cookie) pode ser registrado em logs da Cloudflare ou de plataformas de APM.
* **Aplicação:** O módulo `scrubber.ts` substitui automaticamente campos confidenciais por `[REDACTED]` antes de qualquer emissão de log.

---

## 3. Regras Comerciais e de Conteúdo

### RN-007: Taxa de Inscrição Somente Após Aprovação
* **Regra:** O envio do formulário de triagem é **gratuito e confidencial**. A taxa de inscrição do Programa Residencial (R$ 500,00) é paga **exclusivamente após a entrevista e a aprovação pastoral**; não há cobrança no preenchimento da triagem.
* **Aplicação:** A regra aparece no formulário de triagem, na tela de confirmação, nas perguntas frequentes, na página do Residencial e na página do Campus (`residentialProgram.feeNotice` em `site-config.ts`).

### RN-008: Doações pela Chave PIX Institucional
* **Regra:** Enquanto a diretoria não definir o gateway de pagamento, as doações são feitas diretamente pela chave PIX do CNPJ 97.548.932/0001-05, com envio do comprovante pelo WhatsApp pastoral.
* **Aplicação:** `PUBLIC_ENABLE_PIX_GATEWAY=false` (padrão). A estrutura de PIX dinâmico (Asaas e Mercado Pago) permanece pronta para ativação.

### RN-009: Não Retenção de Dados do Site Antigo
* **Regra:** Nenhum dado pessoal do site antigo (clientes, pedidos, doações, inscritos e usuários do WordPress) é importado, migrado ou mantido no ecossistema novo.
* **Aplicação:** Ver [Migração do Site Antigo](../operations/legacy-migration.md).

### RN-010: Depoimentos e Imagens com Autorização
* **Regra:** Depoimentos e fotos com pessoas identificáveis só são publicados com autorização expressa, identificando o autor apenas da forma autorizada (ex.: iniciais e cidade).
* **Aplicação:** Depoimentos em `src/data/testimonials.ts`; fotos do campus em `src/data/campus-photos.ts`.

### RN-011: Site Novo como Referência de Conteúdo
* **Regra:** Em caso de divergência entre o site novo e o site antigo, redes sociais ou materiais impressos, prevalece o **site novo** (preços, contatos, nomes de cursos e programas).
* **Aplicação:** Alterações de conteúdo seguem o fluxo de [Gestão de Conteúdo do Site](../operations/content-management.md).
