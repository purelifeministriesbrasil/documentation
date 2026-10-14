# Modelagem de Ameaças & AppSec Playbook

A modelagem de ameaças da Pure Life Ministries Brasil utiliza a metodologia **STRIDE** e a classificação de risco **DREAD** para identificar e mitigar vulnerabilidades potenciais contra os dados sensíveis da organização.

---

## 1. Ativos Mais Críticos (*Crown Jewels*)

1. **Relatos de Triagem Pastoral**: Depoimentos confessionais de sofrimento espiritual e moral (Art. 11 LGPD e sigilo pastoral).
2. **Dados Pessoais Identificáveis (PII)**: Nomes, CPFs de doadores, números de WhatsApp e endereços eletrônicos.
3. **Credenciais e Chaves Criptográficas**: Chaves secretas do Supabase (`service_role`), chaves AES-256 e segredos de webhook do gateway financeiro.

---

## 2. Matriz de Mitigação STRIDE

| Categoria STRIDE | Vetor de Ameaça em Potencial | Controles e Mitigações Implementados |
| :--- | :--- | :--- |
| **Spoofing** (Falsificação de Identidade) | Ataque simulando webhooks de pagamento PIX para confirmar doações falsas | Asaas: token comparado em tempo constante; Mercado Pago: HMAC-SHA256 do manifesto + consulta autenticada do pagamento. Divergência de valor é auditada e não confirma a doação |
| **Tampering** (Adulteração de Dados) | Tentativa de manipular campos ou status de triagens no banco | Nenhum acesso público ao banco (RLS sem políticas + REVOKE); cifra autenticada AES-GCM com AAD; máquina de estados impede regressão de cobranças confirmadas |
| **Repudiation** (Repúdio) | Doador ou assistido contestando transação ou consentimento fornecido | Consentimento com versão da política, data e rota; `audit_events` registra leituras pastorais (com motivo) e decisões sobre webhooks |
| **Information Disclosure** (Vazamento de Informação) | Leitura não autorizada de relatos pastorais por usuários anônimos | Roles `anon`/`authenticated` sem privilégios; cifra de campo; logs com scrubber; e-mails só como HMAC com pepper |
| **Denial of Service** (Negação de Serviço) | Bots inundando formulários com mensagens de spam e scripts automatizados | Turnstile nos formulários; `Content-Length` e corpo limitados em bytes; idempotência; cooldown de reenvio da newsletter; regra de Rate Limiting recomendada na zona |
| **Elevation of Privilege** (Elevação de Privilégio) | Usuário público tentando invocar privilégios administrativos via client JS | Frontend sem nenhuma chave do Supabase; segredos só no Worker (`wrangler secret`), validados fail-closed |

---

## 3. Diretrizes de Desenvolvimento Seguro

- **CSP por hash / Zero Inline Style**: scripts inline gerados pelo Astro são autorizados por hash SHA-256 calculado no build (sem `'unsafe-inline'`); handlers inline e atributos `style` quebram o build.
- **Validação de Entrada Incondicional**: Todos os dados recebidos são obrigatoriamente passados por validadores estritos Zod (`.strict()`).
- **Sanitização de Saída**: Prevenção total contra Cross-Site Scripting (XSS) através de escape automático do ecossistema Astro/React.
