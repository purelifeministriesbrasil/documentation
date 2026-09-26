# Especificação de Requisitos do Sistema (SRS)

**Documento Canônico de Engenharia de Requisitos e Governança de Dados**  
**Versão:** Canônica (Modernizada: Supabase & Vercel)  
**Conformidade:** LGPD (Lei Federal nº 13.709/2018), ASVS v4.0.3, ISO/IEC/IEEE 29148  

---

## 1. Sumário Executivo & Escopo do Ecossistema

O presente documento estabelece a especificação formal, exaustiva e auditável de todos os requisitos do ecossistema digital da **Pure Life Ministries Brasil** (`purelifeministriesbrasil.org`). O ecossistema opera sob uma arquitetura multirepo enxuta e desacoplada composta por 3 repositórios essenciais, orientada pela regra canônica:

> **"Front com Front, Back com Back e Docs com Docs."**

1. **`frontend` (`purelife-web`):** Aplicação em Astro 5 SSG, Tailwind CSS v4, microinterações e Ilhas React restritas, hospedada na **Vercel Edge** com cliente nativo Supabase e esquemas Zod locais.
2. **`backend` (`purelife-api`):** Cloudflare Worker independente com Clean Architecture / DDD, integração ao gateway Asaas (PIX Dinâmico) e rotinas cron de expurgo LGPD no **Supabase Postgres**.
3. **`documentation` (`purelife-docs`):** Documentação técnica canônica, ADRs, runbooks e este SRS compilados com **Material for MkDocs** e publicados via GitHub Pages.

---

## 2. Macrodomínios Funcionais

O sistema atende a cinco macrodomínios funcionais:

```mermaid
flowchart LR
    Aconselhamento["1. Aconselhamento Pastoral<br>Triagem confidencial criptografada"]
    Educacional["2. Plataforma de Formação<br>Capacitação e Pós-Graduação"]
    Financeiro["3. Sustentabilidade & Doações<br>PIX Dinâmico com lease atômico"]
    Editora["4. Editora e Literatura<br>Materiais didáticos especializados"]
    Conferencia["5. Conferência Nacional<br>Inscrições e credenciamento"]
```

* **Núcleo de Aconselhamento Bíblico:** Triagem confidencial e gestão de programas de restauração (Residencial, Vencedores em Casa, Para Esposas e Aconselhamento Suplementar).
* **Plataforma Educacional:** Cursos e Pós-Graduação em Aconselhamento Bíblico e Distúrbios da Sexualidade.
* **Doações & Sustentabilidade Financeira:** Ingestão de doações pontuais e recorrentes via PIX dinâmico com conciliação bancária idempotente.
* **Literatura & Editora:** Catálogo de livros didáticos e literatura bíblica reformada.
* **Eventos & Conferências:** Inscrição, credenciamento e emissão de ingressos para conferências anuais.

---

## 3. Mapeamento de Stakeholders & Personas (RBAC)

O ecossistema atende perfis com demandas heterogêneas de sigilo, usabilidade e privilégios operacionais:

| Persona | Perfil | Nível de Acesso | Requisito Crítico |
| :--- | :--- | :--- | :--- |
| **PER-001** | Homem / Mulher em Busca de Ajuda | Público (Anon) | Anonimato, criptografia de ponta a ponta, sem rastro em logs |
| **PER-002** | Familiar / Cônjuge Solicitante | Público (Anon) | Discrição, agilidade no contato via WhatsApp ou e-mail |
| **PER-003** | Doador / Mantenedor Ministerial | Público (Anon) | PIX dinâmico instantâneo, recibo transparente, sem fricção |
| **PER-004** | Aluno / Participante de Conferência | Autenticado | Inscrição segura, confirmação de presença e materiais |
| **PER-005** | Conselheiro / Equipe Pastoral Interna | Restrito (Staff) | Decodificação segura de triagens autorizadas, sem exportação em massa |
| **PER-006** | Encarregado de Dados (DPO / Auditor) | Governança | Relatório de conformidade LGPD, logs de expurgo e integridade |

---

## 4. Estrutura Modular da Especificação

Para consulta rápida e manutenção objetiva, a especificação é dividida nos seguintes módulos:

* [**Requisitos Funcionais (RFs)**](functional.md): Regras de formulários, doações, conferência e editora.
* [**Regras de Negócio (RNs)**](business-rules.md): Políticas pastorais, maioridade legal (18+), expurgo e limites.
* [**Requisitos Não-Funcionais & LGPD**](non-functional.md): Padrões de segurança, latência, acessibilidade e conformidade legal.
