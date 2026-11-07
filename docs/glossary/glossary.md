# Glossário de Domínio (DDD) e Engenharia

**Linguagem Ubíqua (*Ubiquitous Language*) do Ecossistema Pure Life Ministries Brasil**  
**Atualizado em:** 07/11/2026 (auditoria documental; baseline backend `ca9737f`, frontend `4a08dfc`)  
**Classificação:** Referência Terminológica para Engenharia e Ministério

---

## 1. Termos de Domínio Ministerial e Aconselhamento Bíblico

| Termo de Domínio | Definição | Contexto Operacional / Sistema |
|---|---|---|
| **Aconselhamento Bíblico** | Prática pastoral focada na aplicação das Escrituras Sagradas como autoridade suficiente para tratar desordens emocionais, compulsões e pecados sexuais. | Módulo central de triagem e acompanhamento do ecossistema. |
| **Programa Residencial** | Programa presencial de 9 meses no campus em Águas Lindas de Goiás – GO, exclusivo para homens adultos (≥ 18 anos). Inscrição de R$ 500,00 somente após entrevista e aprovação; mensalidade de R$ 1.200,00. | Tabela `triage_submissions` com `program_interest = 'residencial'`. |
| **Online Vida Pura** | Programa de aconselhamento online com sessões semanais ao vivo, para quem busca transformação mantendo a rotina de trabalho e família. Sucessor do antigo “Vencedores em Casa”; inscrição pela plataforma Hotmart. | Tabela `triage_submissions` com `program_interest = 'online'`. |
| **Acompanhamento para Esposas** | Aconselhamento confidencial para mulheres feridas pelo pecado sexual do cônjuge, conduzido por conselheiras. Não é exibido como programa no site, mas pode ser solicitado pela triagem. | Tabela `triage_submissions` com `program_interest = 'esposas'`. |
| **Trauma de Traição (*Betrayal Trauma*)** | Quadro de choque emocional profundo, desregulação afetiva e hipervigilância vivenciado pela esposa após descobrir a quebra do pacto matrimonial pelo cônjuge. | Diretriz de sensibilidade no acompanhamento de esposas. |
| **Sigilo Pastoral** | Dever moral dos conselheiros de não revelar os relatos íntimos compartilhados pelos aconselhados. | Refletido na cifragem AES-256-GCM, no RLS sem políticas e na caixa pastoral auditada. |
| **Formação Superior Sequencial** | Curso “Formação Superior Sequencial em Sexualidade Humana sob Perspectiva Bíblica”, de 6 meses e 100% online, certificado pela Faculdade Coram Deo, com chancela SEBI + Pure Life Ministries. | Página `/curso/`; contato pelo WhatsApp exclusivo do curso. |
| **Viagem EUA** | Viagem à sede da Pure Life Ministries (Kentucky, EUA) com participação na conferência anual; pagamento na plataforma da SEBI. | Página `/viagem-eua/`; dados em `src/data/usa-trip.ts`. |
| **Linha do Tempo** | História do ministério de 1986 a 2023, com os marcos do Brasil em destaque. | Seção da página `/sobre/`; dados em `src/data/timeline.ts`. |

---

## 2. Termos de Engenharia de Software, Arquitetura e AppSec

| Termo Técnico | Definição | Aplicação no Ecossistema |
|---|---|---|
| **AAD (*Additional Authenticated Data*)** | Dados em texto claro autenticados (mas não cifrados) pelo AES-GCM, que vinculam o ciphertext ao seu contexto. | Impede a troca de ciphertexts entre registros (*cross-row splicing*) com o contexto `entidade:id:campo:versão`. |
| **AES-256-GCM** | Modo de cifra autenticada (AEAD) sobre o AES com chave de 256 bits, que garante confidencialidade e integridade. | Padrão criptográfico para dados sensíveis em repouso (ADR-004). |
| **Astro 5 SSG** | Framework web que gera páginas em HTML estático no momento do build (*Static Site Generation*). | Base do repositório `frontend`. |
| **Ilhas Preact** | Componentes interativos hidratados isoladamente numa página estática, escritos com a API do React e executados pelo Preact. | Formulários de triagem, contato e doação (ADR-009). |
| **`astro:assets`** | Pipeline de imagens do Astro que gera AVIF e WebP em vários tamanhos durante o build. | Fotos do campus, logos e capas em `src/assets/images/`. |
| **Cloudflare Worker** | Ambiente *serverless* de execução na borda. | Runtime da API (`backend`), dos webhooks e do cron diário. |
| **Cloudflare Hyperdrive** | Serviço que mantém conexões abertas com um banco Postgres a partir da rede da Cloudflare. | Binding `HYPERDRIVE` da API; reduz a latência de cada consulta (ADR-008). |
| **Cloudflare Pages** | Hospedagem estática na rede global da Cloudflare, com headers e redirecionamentos configuráveis (`_headers`, `_redirects`). | Hospedagem do repositório `frontend` (ADR-007). |
| **Cloudflare Turnstile** | Verificação anti-robô sem captcha visual. | Protege triagem, contato, doação e newsletter (RF-002). |
| **Neon Postgres** | PostgreSQL gerenciado e *serverless*, que suspende o processamento quando ocioso e o retoma na conexão seguinte. | Camada de persistência central (região São Paulo), acessada somente pela API (ADR-008). |
| **Row Level Security (RLS)** | Mecanismo do PostgreSQL que controla, linha a linha, quem pode inserir, consultar ou modificar dados. | Ligado em todas as tabelas **sem políticas**: nenhuma role pública acessa os dados; só a API. |
| **Expurgo Automático** | Nulificação irreversível dos campos pessoais de triagens e contatos após 180 dias. | Cron diário do Worker sobre o Neon. **Só triagens e contatos** expiram; as demais tabelas não têm expurgo (limitação conhecida, R1). |
| **Idempotência** | Propriedade de repetir uma operação sem repetir seu efeito. | `Idempotency-Key` nos formulários e na criação de PIX; lease nos webhooks (ADR-005). |
| **Lease** | Reserva temporária (60 s, máx. 5 tentativas) de um evento de webhook por uma execução do Worker; esgotadas as tentativas, o evento vai para `dead_letter`. | Tabela `payment_webhook_events`. |
| **Caixa Pastoral** | CLI auditada (`backend/scripts/pastoral-inbox.mjs`) que decifra localmente triagens e contatos e registra cada leitura em `audit_events`. | Substitui o editor de tabelas do banco, que exibe apenas ciphertext. |
| **Zod (`zod/mini`)** | Biblioteca de esquemas tipados em TypeScript; `zod/mini` é a API funcional e mais leve da mesma versão. | Validação idêntica no navegador e na API (`src/schemas/` nos dois repositórios). |
| **Redirecionamento 301** | Resposta HTTP que indica mudança permanente de endereço. | `public/_redirects` com os endereços do site antigo (RF-017). |
| **CSP (*Content Security Policy*)** | Cabeçalho que restringe as origens de scripts, estilos e conexões que a página pode usar. | Gerada no build com *hashes* dos scripts inline (`scripts/generate-csp.mjs`). |
| **Porta (*port*)** | Interface em `application/ports/` que descreve o que um caso de uso precisa do mundo externo. | Ex.: `EncryptionProvider`, `PaymentGateway`, `Notifier`. Ver [Camadas do Backend](../architecture/backend-layers.md). |
| **Adaptador** | Implementação de uma porta em `infrastructure/`. | Ex.: `createAesGcmProvider`, `createTurnstileAdapter`. |
| **Caso de uso** | Função de `application/usecases/` que executa uma regra de negócio usando portas. | Ex.: `submit-triage`, `create-pix-charge`. |
| **Composition root** | Único ponto que instancia adaptadores e os liga aos handlers. | `backend/src/index.ts`. |
| **Unit of Work** | Operação que agrupa várias gravações numa transação. | `triage-unit-of-work` (insere a triagem, cifra, grava consentimento). |
| **HMAC e pepper** | Hash com chave: o HMAC-SHA256 do e-mail usa o segredo `HASH_PEPPER`, o que permite deduplicar sem guardar o e-mail em claro. | `email_hash`, `donor_email_hash`. |
| **PII** | Informação pessoalmente identificável (nome, e-mail, telefone, relato). | Removida dos logs pelo scrubber. |
| **Double opt-in** | Inscrição que só vale após confirmação por link enviado ao e-mail. | Newsletter (token de 48 h). |
| **Migration e checksum** | Arquivo SQL versionado em `backend/drizzle/`; o runner grava o SHA-256 e recusa migration já aplicada que tenha sido editada. | `scripts/migrate.mjs`, tabela `schema_migrations`. |
| **Cron Trigger** | Agendamento do Cloudflare Worker (`0 3 * * *`, 03:00 UTC). | Dispara `scheduled()` para o expurgo. |
| **Ilha Preact × componente Astro** | Componente `.astro` é renderizado no build e não envia JavaScript; ilha Preact (`.tsx` com `client:*`) é hidratada no navegador. | Ver [Estrutura do Frontend](../architecture/frontend-structure.md). |
| **Dead letter** | Estado final de um evento de webhook que esgotou as tentativas. | Gera o log `webhook.dead_letter` e exige ação manual. |
