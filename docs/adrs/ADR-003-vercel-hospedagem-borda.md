# ADR-003: Hospedagem e Borda na Vercel

- **Status**: Aprovado
- **Data**: 2026-09-25
- **Decisores**: Equipe de Engenharia Pure Life Ministries Brasil

---

## 1. Contexto e Motivação

Anteriormente, o deploy do frontend dependia de um repositório separado de infraestrutura (`purelife-infra`) com configurações complexas em Terraform para Cloudflare Pages, DNS, certificados e regras de WAF.

Essa abordagem gerava atritos frequentes:

1. Deploys quebravam quando o Terraform e o código do frontend saíam de sincronia.
2. Dificuldade de pré-visualização de alterações (*Preview Deployments*) para revisões de design.
3. Complexidade excessiva para uma organização ministerial sem equipe de DevOps em tempo integral.

---

## 2. Decisão

Adotar a **Vercel** como a plataforma oficial de hospedagem, build contínuo e CDN do frontend (`frontend`):

1. **Compilação Estática Pura**: O Astro compila diretamente para a pasta `dist/` estática, sem necessidade de adapters pesados de runtime.
2. **Deploy Automático Git**: Integração nativa com o repositório GitHub, gerando deploys instantâneos a cada push na branch `main` e URLs de pré-visualização para cada Pull Request.
3. **Cabeçalhos de Segurança via `vercel.json`**: Definição declarativa de headers de segurança (HSTS, CSP, X-Frame-Options, Permissions-Policy) e cache imutável para assets estáticos.

---

## 3. Alternativas Rejeitadas

- **Cloudflare Pages via Terraform**: Rejeitado pela dependência desnecessária de pipelines complexos de IaC e estado remoto para um site estático.
- **AWS S3 + CloudFront**: Rejeitado pela complexidade de configuração de permissões IAM, políticas de bucket, certificados ACM e custo administrativo.
- **GitHub Pages para o Frontend**: Rejeitado pela falta de suporte nativo a cabeçalhos de segurança customizados (CSP, X-Frame-Options) e limitações de roteamento.

---

## 4. Consequências

### Impactos Positivos:
- **Deploy em 6 Segundos**: Tempo de compilação e publicação reduzido drasticamente.
- **Desativação do Repositório `infra`**: Eliminação de dívida técnica e scripts de Terraform legados.
- **Rede Global de Borda (Anycast CDN)**: Alta resiliência e entrega rápida de páginas para usuários em todo o Brasil e no exterior.
