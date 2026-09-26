# Glossário Canónico de Domínio (DDD) e Engenharia

**Linguagem Ubíqua (*Ubiquitous Language*) do Ecossistema Pure Life Brasil**  
**Versão:** 1.0.0  
**Classificação:** Referência Terminológica para Engenharia e Ministério

---

## 1. Termos de Domínio Ministerial e Aconselhamento Bíblico

| Termo de Domínio | Definição Canónica | Contexto Operacional / Sistema |
|---|---|---|
| **Aconselhamento Bíblico** | Prática pastoral focada na aplicação das Escrituras Sagradas como autoridade suficiente para tratar desordens emocionais, compulsões e pecados sexuais. | Módulo central de triagem e acompanhamento do ecossistema. |
| **Programa Residencial** | Regime de internato de 9 meses localizado no campus em Águas Lindas de Goiás / DF, exclusivo para homens adultos ($\ge 18$ anos). Dividido em Fase I (6 meses de fundamentação) e Fase II (3 meses de transição). | Entidade `InscricaoPrograma` com `tipo_programa = 'RESIDENCIAL'`. |
| **Programa Vencedores em Casa** | Programa de aconselhamento à distância com duração de 6 meses, voltado para homens que não podem se internar, mulheres em luta com pecado sexual e adolescentes maduros ($\ge 16$ anos). | Entidade `InscricaoPrograma` com `tipo_programa = 'ONLINE'`. |
| **Programa Para Esposas** | Acompanhamento individual e confidencial de 18 semanas para mulheres cujos maridos cometeram adultério ou estão presos na pornografia. Conduzido exclusivamente por conselheiras experientes. | Entidade `InscricaoPrograma` com `tipo_programa = 'ESPOSAS'`. |
| **Aconselhamento Suplementar** | Ciclos adicionais de até 6 sessões semanais pós-formatura para prestação de contas contínua, intencionalmente alocados para um novo conselheiro bíblico. | Regra de negócio `RN-008`. |
| **Trauma de Traição (*Betrayal Trauma*)** | Quadro de choque emocional profundo, desregulação afetiva e hipervigilância vivenciado pela esposa após descobrir a quebra do pacto matrimonial pelo cônjuge. | Diretriz de sensibilidade no módulo `Para Esposas`. |
| **Sigilo Pastoral e Sacerdotal** | Obrigação moral e dever de confissão inviolável mantido pelos conselheiros da Pure Life em relação aos relatos íntimos compartilhados pelos aconselhandos. | Refletido no controle de acesso RBAC e cifra AES-256-GCM em repouso. |

---

## 2. Termos de Engenharia de Software, Arquitetura e AppSec

| Termo Técnico | Definição Canónica | Aplicação no Ecossistema |
|---|---|---|
| **AAD (*Additional Authenticated Data*)** | Dados em texto claro que são criptograficamente autenticados pelo algoritmo AES-GCM, vinculando o identificador do registro ao seu conteúdo cifrado. | Previne o ataque de *cross-row splicing* vinculando `triagem_id` à coluna. |
| **AES-256-GCM** | Cifra de fluxo simétrica com autenticação integrada (AEAD) que garante simultaneamente confidencialidade e integridade da mensagem. | Padrão criptográfico obrigatório para dados de triagem (ADR-004). |
| **Astro SSG** | Compilador web moderno que gera páginas em HTML puramente estático no momento do build (*Static Site Generation*). | Base do repositório `purelife-web` (`frontend`), garantindo TTFB $\le 200$ms. |
| **Cloudflare Worker** | Ambiente serverless de execução na borda baseado em V8 isolates da Cloudflare, com latência zero e tempo de inicialização imperceptível. | Runtime do repositório `purelife-api` (`backend`). |
| **Desacoplamento Físico Sanity / Neon** | Princípio arquitetural que proíbe o trânsito ou gravação de dados pessoais de aconselhamento dentro do CMS editorial Sanity. | Definido no ADR-002 e na regra `RN-005`. |
| **Expurgo Criptográfico** | Destruição irreversível de dados sensíveis mediante a sobrescrita dos campos por valores nulos e descarte de chaves decifradoras (Crypto-shredding). | Implementado no cron noturno para triagens com mais de 180 dias. |
| **Idempotency Key (Chave de Idempotência)** | Identificador único transmitido no cabeçalho HTTP que permite repetir com segurança uma requisição de pagamento sem risco de duplicidade. | Utilizado em doações Pix e cartão de crédito (ADR-005). |
| **Lease Atômico (`pg_try_advisory_xact_lock`)** | Mecanismo de trava consultiva no PostgreSQL que vincula o processamento de um webhook a uma transação atômica única. | Impede corridas concorrentes no processamento de webhooks de pagamento. |
| **Neon Postgres Serverless** | Banco de dados PostgreSQL com arquitetura desacoplada de computação e armazenamento sobre Cloud Storage seguro. | Camada de persistência relacional transacional do backend. |
| **RBAC (*Role-Based Access Control*)** | Controle de autorização baseado em papéis atribuídos a cada usuário autenticado (`ADMIN`, `CONSELHEIRO`, `ALUNO`, etc.). | Enforçado em middleware no Worker antes de qualquer consulta de dados. |
| **Sanity Content Lake** | Banco de dados orientado a documentos JSON com consultas via GROQ para conteúdo editorial público. | Camada de dados do repositório `purelife-cms`. |
| **Zero-JS** | Diretriz de arquitetura onde páginas de conteúdo estático não transmitem nenhum script JavaScript para o cliente, maximizando performance e segurança. | Filosofia aplicada a 15 páginas públicas do `purelife-web`. |
