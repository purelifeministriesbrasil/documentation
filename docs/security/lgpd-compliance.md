# Conformidade com a Lei Geral de Proteção de Dados (LGPD)

O ecossistema digital da Pure Life Ministries Brasil trata a proteção da privacidade não como uma obrigação burocrática, mas como um dever cristão de zelo, integridade e fidelidade aos assistidos.

---

## 1. Bases Legais Aplicadas (Lei nº 13.709/2018)

| Fluxo / Dado | Categoria do Dado | Base Legal Principal (LGPD) |
| :--- | :--- | :--- |
| **Triagem Pastoral** | **Dados Pessoais Sensíveis** (religião, vida sexual, saúde mental) | **Art. 11, I**: consentimento específico e destacado do titular para finalidades determinadas; e **Art. 11, II, "d"**: atividades de entidades sem fins lucrativos de caráter religioso. |
| **Formulário de Contato** | Dados Pessoais Ordinários (nome, e-mail, telefone) | **Art. 7º, V**: procedimentos preliminares a pedido do titular. |
| **Doação por PIX dinâmico** (quando ativado) | Valor, frequência e e-mail **opcional** do doador | **Art. 7º, II**: obrigação legal (fiscal/contábil); **Art. 7º, I**: consentimento, para o e-mail. Não há coleta de CPF: o gateway recebe um cliente institucional anônimo. |
| **Doação pela chave PIX do CNPJ** (padrão) | Nenhum dado passa pelo sistema | O comprovante, se enviado, segue pelo WhatsApp pastoral, fora do banco. |
| **Inscrição de Newsletter** | E-mail | **Art. 7º, I**: consentimento do titular, com confirmação dupla. |

---

## 2. Princípios de Proteção de Dados Implementados

### A. Necessidade e Minimização
O formulário de triagem pede apenas o essencial para o primeiro contato. O relato pessoal é **opcional**, para que
o assistido compartilhe detalhes apenas se e quando se sentir confortável. E-mails são deduplicados por HMAC com
*pepper*, sem guardar o endereço em claro para busca.

### B. Ciclo de Vida e Retenção (180 dias)
Cada triagem e mensagem de contato recebe `retention_until` de 180 dias a partir do envio; vencido o prazo, o cron
diário do Worker anula todos os identificadores e conteúdos cifrados (ver RN-002 e RN-002-A).

### C. Segurança (Art. 46)
Campos sensíveis são cifrados com AES-256-GCM antes de chegar ao banco; o banco não tem acesso público (RLS sem
políticas + REVOKE); toda leitura pastoral exige motivo e fica registrada em `audit_events`. Detalhes em
[Arquitetura Criptográfica](crypto-architecture.md) e [Modelagem de Ameaças](threat-model.md).

### D. Direitos do Titular (Art. 18)
O titular pode pedir confirmação de tratamento, acesso, correção ou eliminação pelo e-mail institucional
**purelifeministriesbrasil1986@gmail.com**, o mesmo informado na Política de Privacidade do site.

---

## 3. Operadores e Localização dos Dados

| Operador | Função | Dados tratados |
|---|---|---|
| **Neon** (AWS `sa-east-1`, São Paulo) | Banco de dados PostgreSQL | Registros cifrados, hashes e trilha de auditoria |
| **Cloudflare** | Site (Pages), API (Workers), Hyperdrive e Turnstile | Dados em trânsito; nenhum armazenamento de conteúdo |
| **Resend** | Envio de e-mails transacionais | Endereço do destinatário (confirmação de newsletter e aviso à equipe, este só com o código de referência) |
| **Asaas / Mercado Pago** (se o PIX dinâmico for ativado) | Gateway de pagamento | Valor da cobrança |

## 4. Dados do Site Antigo

Por decisão da diretoria, **nenhum dado pessoal do WordPress** (clientes, pedidos, doações, inscritos ou usuários)
foi importado ou é mantido no ecossistema novo. O backup recebido da agência deve ser descartado de forma segura
após a virada do domínio (ver [Migração do Site Antigo](../operations/legacy-migration.md)).
