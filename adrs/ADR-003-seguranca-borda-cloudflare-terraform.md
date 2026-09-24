# ADR-003 — Infraestrutura de Borda como Código (Cloudflare via Terraform)

## Status
Aprovado (§9.4, §17.1 da Especificação Canónica v5.0).

## Contexto
O domínio `purelifebrasil.org` foi alvo no passado de injeções de spam de apostas e cassinos sob WordPress legado. Para restaurar a reputação do domínio e proteger os serviços contra abusos:
1. É indispensável remover do índice do Google todas as URLs de spam e rotas antigas do WordPress.
2. A configuração de borda (regras de firewall, redirects, cabeçalhos de segurança e limites de taxa) não pode ser gerenciada manualmente pelo painel da Cloudflare sem versionamento, auditoria ou reprodutibilidade.

## Decisão
1. **Toda a infraestrutura de borda é declarada em Terraform (`purelife-infra`)**:
   - `cloudflare_rules.tf`: Configuração de WAF e regras de `410 Gone`.
   - `headers.tf`: Cabeçalhos HTTP de segurança e regras especiais de privacidade.
   - `rate_limiting.tf`: Rate limiting granular por IP para proteção dos endpoints da API.
2. **Resposta 410 Gone para Legado e Spam**:
   - Rotas de WordPress (`/wp-admin*`, `/wp-login.php`, `/wp-content*`, `/xmlrpc.php`, etc.) e padrões de palavras-chave de cassino/apostas recebem imediatamente resposta HTTP `410 Gone`.
   - O uso de `301 Moved Permanently` para a home page é **estritamente proibido**, pois transferiria a associação tóxica do spam para o novo site.
3. **CSP em Report-Only com 7 Critérios de Saída**:
   - O Content Security Policy entra inicialmente em modo `Content-Security-Policy-Report-Only` até que passe pelos 7 critérios de saída antes do modo enforce.
   - A rota `/triagem/*` recebe cabeçalhos adicionais `Cache-Control: no-store, private` e `Referrer-Policy: no-referrer`.

## Consequências
- **Positivas**:
  - Aceleração drástica da remoção de URLs tóxicas no Google Search Console.
  - Toda alteração na borda da CDN é rastreável via Git e validada por pipelines de CI/CD.
  - Proteção ativa contra scraping malicioso e ataques de negação de serviço em formulários sensíveis.
