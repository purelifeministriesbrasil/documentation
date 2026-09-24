# Conformidade Legal e LGPD: Ministério Pure Life Brasil

Documento de diretrizes e salvaguardas técnicas para atendimento à Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD).

## 1. Classificação dos Dados e Bases Legais

| Categoria de Dado | Exemplos no Sistema | Classificação Legal | Base Legal (LGPD) | Tratamento e Segurança |
|---|---|---|---|---|
| **Relato Confessional e Histórico de Compulsão** | Texto livre do formulário de triagem | **Dado Sensível** (Art. 5º, II — Saúde e Convicção Religiosa) | Art. 11, I (Consentimento específico e destacado) | Cifrado com AES-256-GCM com AAD rígido; retido por no máx. 180 dias; expurgo automatizado. |
| **Identificação e Contato** | Nome, e-mail, telefone, canal preferencial | **Dado Pessoal** | Art. 7º, I (Consentimento) | Cifrado separadamente do relato pastoral; acesso auditado com justificativa obrigatória. |
| **Comprovante de Consentimento** | Rota de origem, data ISO, versão da política | Metadado de Conformidade | Art. 8º, § 2º (Ônus da prova do consentimento) | Tabela `triage_consents` com chave estrangeira real; preservada mesmo após expurgo do conteúdo. |
| **Doações e Transações Pix** | Valor da doação, ID da cobrança, status | Dado Financeiro / Transacional | Art. 7º, V (Execução de contrato/termo de adesão) | Mínimo estrito; zero armazenamento de dados de cartão na base própria. |

---

## 2. Princípios de Proteção Aplicados

1. **Portão de Maioridade (Proteção a Menores)**:
   - Menores de 18 anos são impedidos de registrar submissões de triagem no site. O esquema Zod rejeita qualquer submissão que não contenha `isAdult: true`, redirecionando o jovem para canal de atendimento humanizado ou pastoral com autorização dos pais.
2. **Minimização de Dados (Data Minimization)**:
   - Apenas o estritamente necessário para o primeiro contato pastoral é coletado.
3. **Expurgo em Três Níveis**:
   - Submissões sem conversão ou contato são expurgadas aos 180 dias por rotina cron.
   - O expurgo elimina referências, telefones, e-mails e relatos, mantendo apenas `id`, `created_month`, `status = 'purged'` e `purged_at` para prestação de contas estatística sem reidentificação.
4. **Canal do Titular**:
   - Disponibilizado canal para exercício de direitos (confirmação de tratamento, acesso, revogação do consentimento e eliminação) via `privacidade@purelifebrasil.org`.
