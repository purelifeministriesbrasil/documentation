# ADR-002 — Isolamento Absoluto entre Conteúdo Editorial (Sanity) e Dados Sensíveis (Neon)

## Status
Aprovado (§4.4, §5.1 e ADR-002 da Especificação Canónica v5.0).

## Contexto
O ecossistema Pure Life Brasil lida com dois tipos fundamentalmente opostos de dados:
1. **Conteúdo Editorial Público**: Páginas, programas, cursos, livros, episódios de podcast, FAQs e depoimentos com consentimento expresso.
2. **Dados Pessoais e Sensíveis de Triagem (LGPD art. 5º, II)**: Relatos de lutas sexuais, confissões íntimas, pedidos de ajuda para internação, dados de contato e dados transacionais de doação.

Misturar esses dados no mesmo banco ou permitir que o CMS acesse submissões de triagem violaria gravemente a privacidade dos titulares e criaria riscos inaceitáveis de vazamento via tokens de API do CMS.

## Decisão
1. **Dois repositórios sem ponte de comunicação direta**:
   - **Sanity Studio v3 (`purelife-cms`)**: Restrito exclusivamente a conteúdo editorial publicável e depoimentos formalmente autorizados.
   - **Neon Postgres (`purelife-api`)**: Restrito aos fluxos transacionais e sensíveis de triagem, consentimentos, contatos, cobranças Pix e logs de auditoria.
2. **Depoimentos Nunca Derivam de Triagem**:
   - É estritamente proibido transformar submissões de formulário de ajuda em depoimentos.
   - Todo depoimento registrado no Sanity nasce de processo editorial independente e exige a flag `publicationConsent: true` com a referência documental correspondente (§4.4).
3. **Criptografia de Campo com AAD no Neon**:
   - Todos os dados sensíveis e relatos confessionais são cifrados em AES-256-GCM com Dados Autenticados Adicionais (AAD) formatados como `${entityType}:${entityId}:${field}:v${keyVersion}`.
   - Relato e contato são cifrados com vetores de inicialização (IVs) distintos.

## Consequências
- **Positivas**:
  - Comprometimento de credenciais do CMS jamais expõe relatos ou contatos de pessoas em aconselhamento.
  - Editores de conteúdo visualizam apenas o que é público.
  - A conformidade com a LGPD é assegurada por barreiras mecânicas e criptográficas na arquitetura.
