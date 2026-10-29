# Requisitos Não-Funcionais (RNFs)

Parâmetros arquiteturais de segurança, desempenho, disponibilidade e usabilidade que regem a plataforma.

---

## 1. Desempenho & Core Web Vitals

### RNF-001: Latência na Borda (Cloudflare Pages & Workers)
* **Métrica:** Tempo de carregamento LCP (Largest Contentful Paint) inferior a **1.0 segundo** em redes 4G nacionais.
* **Métrica:** INP (Interaction to Next Paint) inferior a **50ms**.
* **Métrica:** CLS (Cumulative Layout Shift) **≤ 0,1** (meta: 0), com dimensões declaradas em todas as imagens.
* **Estratégia:** 100% das 18 páginas institucionais pré-renderizadas estaticamente (Astro 5 SSG), servidas via CDN Anycast global; imagens AVIF/WebP responsivas, ilhas Preact e `zod/mini` ([ADR-009](../adrs/ADR-009-performance-ilhas-preact-imagens.md)).
* **Orçamento de JavaScript:** Home sem JavaScript de framework; páginas de formulário com no máximo ~30 KB (gzip).

### RNF-002: Eficiência e Limpeza de Estilos
* **Métrica:** **Zero** atributos residuais `style="..."` em HTML compilado.
* **Métrica:** **Zero** `@import` de fontes em tempo de execução; as fontes oficiais (**Montserrat** e **Ruda**) são servidas localmente em `.woff2` e pré-carregadas.
* **Métrica:** Verificação automatizada no pipeline de CI via `verify-no-inline-style.mjs`.

---

## 2. Segurança da Informação & Defesa em Profundidade

### RNF-003: Blindagem de Acesso ao Banco de Dados (RLS sem políticas)
* **Métrica:** 100% das tabelas com Row Level Security (RLS) habilitado e **nenhuma política** permissiva.
* **Política:** O banco não tem API pública de dados; somente a API (Worker), por meio do Hyperdrive, lê e grava. As roles públicas `anon`/`authenticated`, quando existem, não têm nenhum privilégio. Ver [Hardening do Banco](../operations/database-hardening.md).

### RNF-004: Criptografia em Trânsito e em Repouso
* **Em Trânsito:** HTTPS obrigatório com HSTS (`max-age=31536000; includeSubDomains`); conexões com o banco com `sslmode=require`.
* **Em Repouso:** Criptografia de campo AES-256-GCM com Dados Associados Autenticados (AAD) vinculados a `entidade:id:campo:versão`.

---

## 3. Acessibilidade & Usabilidade

### RNF-005: Conformidade WCAG 2.1 Nível AA
* **Métrica:** Contraste mínimo de 4.5:1 para texto normal e 3:1 para elementos de interface e textos em grande escala.
* **Métrica:** Navegação completa por teclado, sem armadilhas de foco (*no keyboard traps*).
* **Métrica:** Suporte pleno a leitores de tela com marcos semânticos (`<banner>`, `<main>`, `<contentinfo>`, `<nav>`) e atalho inicial para o conteúdo principal.

### RNF-006: Respeito a Preferências de Movimento
* **Métrica:** Compatibilidade com `@media (prefers-reduced-motion: reduce)`, desativando transições e animações decorativas para usuários com sensibilidade vestibular.
