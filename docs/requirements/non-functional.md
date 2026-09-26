# Requisitos Não-Funcionais (RNFs)

Parâmetros arquiteturais de segurança, desempenho, disponibilidade e usabilidade que regem a plataforma.

---

## 1. Desempenho & Core Web Vitals

### RNF-001: Latência na Borda (Vercel Edge & Cloudflare)
* **Métrica:** Tempo de carregamento LCP (Largest Contentful Paint) inferior a **1.0 segundo** em redes 4G nacionais.
* **Métrica:** INP (Interaction to Next Paint) inferior a **50ms**.
* **Métrica:** CLS (Cumulative Layout Shift) estritamente igual a **0.00**.
* **Estratégia:** 100% das 16 páginas institucionais pré-renderizadas estaticamente (Astro 5 SSG), servidas via CDN Anycast global.

### RNF-002: Eficiência e Limpeza de Estilos
* **Métrica:** **Zero** atributos residuais `style="..."` em HTML compilado.
* **Métrica:** **Zero** `@import` de fontes em tempo de execução; todas as fontes oficiais (**Montserrat** e **JetBrains Mono**) são pré-carregadas localmente em formato `.woff2`.
* **Métrica:** Verificação automatizada no pipeline de CI via `verify-no-inline-style.mjs`.

---

## 2. Segurança da Informação & Defesa em Profundidade

### RNF-003: Blindagem de Acesso ao Banco de Dados (Supabase RLS)
* **Métrica:** 100% das tabelas públicas com Row Level Security (RLS) habilitado.
* **Política:** A chave pública `anon` possui exclusivamente permissões de `INSERT` com validação de colunas (`WITH CHECK`). Qualquer tentativa de leitura `SELECT` anônima retorna conjunto vazio.

### RNF-004: Criptografia Homomórfica em Trânsito e Repouso
* **Em Trânsito:** TLS 1.3 obrigatório com HSTS (`max-age=63072000; includeSubDomains; preload`).
* **Em Repouso:** Criptografia de envelope AES-256-GCM com Dados Associados Autenticados (AAD) vinculados ao identificador UUID do registro.

---

## 3. Acessibilidade & Usabilidade

### RNF-005: Conformidade WCAG 2.1 Nível AA
* **Métrica:** Contraste mínimo de 4.5:1 para texto normal e 3:1 para elementos de interface e textos em grande escala.
* **Métrica:** Navegação completa por teclado, sem armadilhas de foco (*no keyboard traps*).
* **Métrica:** Suporte pleno a leitores de tela com marcos semânticos (`<banner>`, `<main>`, `<contentinfo>`, `<nav>`) e atalho inicial para o conteúdo principal.

### RNF-006: Respeito a Preferências de Movimento
* **Métrica:** Compatibilidade com `@media (prefers-reduced-motion: reduce)`, desativando transições e animações decorativas para usuários com sensibilidade vestibular.
