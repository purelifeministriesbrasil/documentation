# Especificação de Requisitos do Sistema (SRS)

**Documento Canônico de Engenharia de Requisitos e Governança de Dados**  
**Versão:** 2026-10-28 (Cloudflare Pages & Workers, Neon Postgres)  
**Conformidade:** LGPD (Lei Federal nº 13.709/2018), ASVS v4.0.3, ISO/IEC/IEEE 29148  

---

## 1. Sumário Executivo & Escopo do Ecossistema

O presente documento estabelece a especificação formal, exaustiva e auditável de todos os requisitos do ecossistema digital da **Pure Life Ministries Brasil** (`purelifeministriesbrasil.org`). O ecossistema opera sob uma arquitetura multirepo enxuta e desacoplada composta por 3 repositórios essenciais, orientada pela regra canônica:

> **"Front com Front, Back com Back e Docs com Docs."**

1. **`frontend` (`purelife-web`):** Aplicação em Astro 5 SSG, Tailwind CSS v4, microinterações e ilhas Preact restritas aos formulários, hospedada no **Cloudflare Pages**, chamando a API em `https://api.purelifeministriesbrasil.org`, com esquemas `zod/mini` e conformidade WCAG/a11y.
2. **`backend` (`purelife-api`):** Cloudflare Worker independente em Hono com Clean Architecture, Drizzle ORM (driver `postgres.js` via Cloudflare Hyperdrive até o Neon Postgres), proteção anti-bot Turnstile, criptografia AES-256-GCM + AAD, integração Asaas e rotinas cron de expurgo LGPD.
3. **`documentation` (`purelife-docs`):** Documentação técnica canônica, ADRs, runbooks e este SRS compilados com **Material for MkDocs** e publicados via GitHub Pages.

---

## 2. Macrodomínios Funcionais

O sistema atende a cinco macrodomínios funcionais:

```mermaid
flowchart LR
    Aconselhamento["1. Aconselhamento Pastoral<br>Triagem confidencial criptografada"]
    Educacional["2. Plataforma de Formação<br>Formação Superior em Sexualidade Humana"]
    Financeiro["3. Sustentabilidade & Doações<br>PIX Dinâmico com lease atômico"]
    Editora["4. Editora e Literatura<br>Materiais didáticos especializados"]
    Conferencia["5. Conferências e Viagem EUA<br>Informações, lotes e inscrição"]
```

* **Núcleo de Aconselhamento Bíblico:** Triagem confidencial e programas de restauração (Programa Residencial e Online Vida Pura).
* **Plataforma Educacional:** Formação Superior Sequencial em Sexualidade Humana sob Perspectiva Bíblica (Faculdade Coram Deo).
* **Doações & Sustentabilidade Financeira:** Doações pela chave PIX do CNPJ, com PIX dinâmico e conciliação idempotente prontos para ativação.
* **Literatura & Editora:** Catálogo de livros e literatura bíblica reformada, com pedido pelo WhatsApp.
* **Eventos & Conferências:** Informações das conferências, playlist das edições anteriores e Viagem/Conferência PLM EUA com pagamento na plataforma da SEBI.

---

## 3. Mapeamento de Stakeholders & Personas (RBAC)

O ecossistema atende perfis com demandas heterogêneas de sigilo, usabilidade e privilégios operacionais:

| Persona | Perfil | Nível de Acesso | Requisito Crítico |
| :--- | :--- | :--- | :--- |
| **PER-001** | Homem / Mulher em Busca de Ajuda | Público (Anon) | Anonimato, criptografia de ponta a ponta, sem rastro em logs |
| **PER-002** | Familiar / Cônjuge Solicitante | Público (Anon) | Discrição, agilidade no contato via WhatsApp ou e-mail |
| **PER-003** | Doador / Mantenedor Ministerial | Público (Anon) | PIX dinâmico instantâneo, recibo transparente, sem fricção |
| **PER-004** | Aluno / Participante de Conferência ou Viagem | Público (Anon) | Informações claras, contato rápido pelo WhatsApp e pagamento seguro em plataforma parceira |
| **PER-005** | Conselheiro / Equipe Pastoral Interna | Restrito (Staff) | Decodificação segura de triagens autorizadas, sem exportação em massa |
| **PER-006** | Encarregado de Dados (DPO / Auditor) | Governança | Relatório de conformidade LGPD, logs de expurgo e integridade |

---

## 4. Estrutura Modular da Especificação

Para consulta rápida e manutenção objetiva, a especificação é dividida nos seguintes módulos:

* [**Requisitos Funcionais (RFs)**](functional.md): Regras de formulários, doações, conferência e editora.
* [**Regras de Negócio (RNs)**](business-rules.md): Políticas pastorais, maioridade legal (18+), expurgo e limites.
* [**Requisitos Não-Funcionais & LGPD**](non-functional.md): Padrões de segurança, latência, acessibilidade e conformidade legal.
