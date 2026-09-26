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
| **Spoofing** (Falsificação de Identidade) | Ataque simulando webhooks de pagamento PIX para confirmar doações falsas | Verificação de assinatura criptográfica HMAC-SHA256 no webhook e conferência direta de status no gateway |
| **Tampering** (Adulteração de Dados) | Tentativa de manipular campos ou status de triagens no banco | Row Level Security (RLS) impedindo `UPDATE` pelo público; cifra autenticada AES-GCM com tag de integridade |
| **Repudiation** (Repúdio) | Doador ou assistido contestando transação ou consentimento fornecido | Registro transacional com carimbo de data/hora (`submitted_at`), versão da política aceita e IP anonimizado |
| **Information Disclosure** (Vazamento de Informação) | Leitura não autorizada de relatos pastorais por usuários anônimos | Bloqueio total de `SELECT` para a role `anon` no Supabase; cifra em repouso |
| **Denial of Service** (Negação de Serviço) | Bots inundando formulários com mensagens de spam e scripts automatizados | Cloudflare Turnstile transparente em todos os formulários; limites de tamanho de payload no edge |
| **Elevation of Privilege** (Elevação de Privilégio) | Usuário público tentando invocar privilégios administrativos via client JS | Chave pública `anon` com permissão estrita de `INSERT`; isolamento total da chave `service_role` |

---

## 3. Diretrizes de Desenvolvimento Seguro

- **Zero Inline Script / Zero Inline Style**: O frontend proíbe scripts e estilos inline, viabilizando uma Content Security Policy estrita (`script-src 'self'`).
- **Validação de Entrada Incondicional**: Todos os dados recebidos são obrigatoriamente passados por validadores estritos Zod (`.strict()`).
- **Sanitização de Saída**: Prevenção total contra Cross-Site Scripting (XSS) através de escape automático do ecossistema Astro/React.
