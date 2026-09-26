# Glossário Canónico de Domínio (DDD) e Engenharia

**Linguagem Ubíqua (*Ubiquitous Language*) do Ecossistema Pure Life Ministries Brasil**  
**Versão:** 2.0.0 (Modernizada)  
**Classificação:** Referência Terminológica para Engenharia e Ministério

---

## 1. Termos de Domínio Ministerial e Aconselhamento Bíblico

| Termo de Domínio | Definição Canónica | Contexto Operacional / Sistema |
|---|---|---|
| **Aconselhamento Bíblico** | Prática pastoral focada na aplicação das Escrituras Sagradas como autoridade suficiente para tratar desordens emocionais, compulsões e pecados sexuais. | Módulo central de triagem e acompanhamento do ecossistema. |
| **Programa Residencial** | Regime de internato de 9 meses localizado no campus em Águas Lindas de Goiás / DF, exclusivo para homens adultos ($\ge 18$ anos). Dividido em Fase I (6 meses de fundamentação) e Fase II (3 meses de transição). | Tabela `triagens` com `program_interest = 'residencial'`. |
| **Programa Vencedores em Casa** | Programa de aconselhamento à distância com duração de 6 meses, voltado para homens que não podem se internar, mulheres em luta com pecado sexual e adolescentes maduros ($\ge 16$ anos). | Tabela `triagens` com `program_interest = 'online'`. |
| **Programa Para Esposas** | Acompanhamento individual e confidencial de 18 semanas para mulheres cujos maridos cometeram adultério ou estão presos na pornografia. Conduzido exclusivamente por conselheiras experientes. | Tabela `triagens` com `program_interest = 'esposas'`. |
| **Trauma de Traição (*Betrayal Trauma*)** | Quadro de choque emocional profundo, desregulação afetiva e hipervigilância vivenciado pela esposa após descobrir a quebra do pacto matrimonial pelo cônjuge. | Diretriz de sensibilidade no módulo `Para Esposas`. |
| **Sigilo Pastoral e Sacerdotal** | Obrigação moral e dever de confissão inviolável mantido pelos conselheiros da Pure Life em relação aos relatos íntimos compartilhados pelos aconselhandos. | Refletido no controle de acesso RLS e isolamento restrito no Supabase. |

---

## 2. Termos de Engenharia de Software, Arquitetura e AppSec

| Termo Técnico | Definição Canónica | Aplicação no Ecossistema |
|---|---|---|
| **AAD (*Additional Authenticated Data*)** | Dados em texto claro que são criptograficamente autenticados pelo algoritmo AES-GCM, vinculando o identificador do registro ao seu conteúdo cifrado. | Previne o ataque de *cross-row splicing* vinculando `triagem_id` ao ciphertext. |
| **AES-256-GCM** | Cifra de fluxo simétrica com autenticação integrada (AEAD) que garante simultaneamente confidencialidade e integridade da mensagem. | Padrão criptográfico para dados sensíveis em repouso (ADR-004). |
| **Astro 5 SSG** | Compilador web moderno que gera páginas em HTML puramente estático no momento do build (*Static Site Generation*). | Base do repositório `frontend`, garantindo carregamento instantâneo. |
| **Cloudflare Worker** | Ambiente serverless de execução na borda para webhooks e tarefas agendadas. | Runtime do repositório `backend`. |
| **Expurgo Automático LGPD** | Destruição irreversível de dados sensíveis após a janela máxima de retenção de 180 dias. | Implementado no cron diário executado no banco Supabase. |
| **Idempotência (Lease Atômico)** | Mecanismo que impede que um mesmo evento de webhook de pagamento seja processado mais de uma vez. | Utilizado em doações Pix e cartão de crédito (ADR-005). |
| **Row Level Security (RLS)** | Políticas de segurança ativas no PostgreSQL que controlam em nível de linha quem pode inserir, consultar ou modificar dados. | Garante que o público só pode executar `INSERT` e jamais `SELECT` nos dados de terceiros. |
| **Supabase Postgres** | Banco de dados relacional PostgreSQL totalmente gerenciado, com suporte a RLS, autenticação e visual Table Editor. | Camada de persistência central e painel pastoral do ecossistema. |
| **Supabase Table Editor** | Interface visual integrada do Supabase utilizada pela equipe pastoral para gerenciar triagens, alterar status e inserir anotações. | Painel administrativo nativo sem necessidade de CMSs adicionais. |
| **Vercel Edge Network** | CDN global com roteamento Anycast de alta performance e suporte nativo a compilação do Astro. | Plataforma de hospedagem do repositório `frontend`. |
| **Zod Schema Validation** | Biblioteca de declaração e inferência de esquemas estritos em TypeScript executada no client e server. | Validação estrita de todos os formulários em `frontend/src/schemas/`. |
