# Requisitos Funcionais (RFs)

Catálogo das capacidades do ecossistema digital da **Pure Life Ministries Brasil**, alinhado ao código dos
repositórios `frontend` e `backend`. Os valores exibidos no site (preços, contatos, datas) estão centralizados em
`frontend/src/lib/site-config.ts` e `frontend/src/data/` (ver [Gestão de Conteúdo](../operations/content-management.md)).

---

## 1. Núcleo de Aconselhamento Bíblico & Triagem

### RF-001: Submissão de Triagem Confidencial
* **Descrição:** Qualquer pessoa maior de 18 anos pode enviar uma solicitação confidencial de ajuda pelo formulário `/triagem/`.
* **Entradas:** confirmação de maioridade, programa de interesse, perfil do solicitante, nome completo, e-mail, telefone/WhatsApp (opcional), canal de contato preferido, relato (opcional, máx. 2000 caracteres) e consentimento explícito com a Política de Privacidade.
* **Comportamento:** contato e relato são cifrados com AES-256-GCM antes de persistir; o cabeçalho `Idempotency-Key` impede duplicidade em reenvios.
* **Saída:** código de referência único no formato `PLM-XXXX-XXXX`.

### RF-002: Verificação Anti-Bot na Borda
* **Descrição:** Triagem, contato, doação e newsletter (com JavaScript) são protegidos pelo Cloudflare Turnstile, sem captchas intrusivos.
* **Comportamento:** token inválido ou ausente é rejeitado com `403` sem tocar no banco. Em produção, as chaves de teste do Turnstile são recusadas.

### RF-003: Confirmação, Gratuidade e Acolhimento Imediato
* **Descrição:** Após o envio, o sistema exibe o código de referência e reforça o sigilo pastoral.
* **Regra exibida:** o envio da triagem é **gratuito**; a taxa de inscrição do Programa Residencial (R$ 500,00) só é paga **após a entrevista e a aprovação pastoral** ([RN-007](business-rules.md#rn-007-taxa-de-inscricao-somente-apos-aprovacao)).
* **Aviso à equipe:** e-mail para `STAFF_NOTIFICATION_EMAIL` apenas com o código, enviado depois da resposta ao usuário.

---

## 2. Sustentabilidade Financeira & Doações

### RF-004: Doação pela Chave PIX Institucional (padrão)
* **Descrição:** A página `/doar/` exibe a chave PIX do CNPJ (97.548.932/0001-05) e o titular, com botão para copiar a chave (somente dígitos) e botão para enviar o comprovante pelo WhatsApp pastoral.
* **Ativação:** padrão enquanto `PUBLIC_ENABLE_PIX_GATEWAY` for diferente de `true`.

### RF-005: Geração de Doação via PIX Dinâmico (opcional)
* **Descrição:** Com `PUBLIC_ENABLE_PIX_GATEWAY=true`, o site gera QR Code e código copia e cola com valor pré-definido (R$ 30, R$ 50, R$ 100, R$ 150 ou R$ 500) ou livre (R$ 5,00 a R$ 50.000,00).
* **Comportamento:** o backend cria a cobrança no gateway configurado (Asaas ou Mercado Pago), com validade de `PIX_EXPIRATION_MINUTES` (padrão 60). Reenvios com a mesma `Idempotency-Key` devolvem a mesma cobrança.

### RF-006: Conciliação de Pagamento via Webhook
* **Descrição:** O backend processa as notificações do gateway quando o pagamento muda de estado.
* **Comportamento:** autentica o webhook (token do Asaas comparado em tempo constante ou HMAC do Mercado Pago), adquire um *lease* de 60 s por evento (máximo de 5 tentativas) e aplica a transição de status de forma condicional; uma doação `confirmed` nunca regride.

---

## 3. Comunicação & Contato Geral

### RF-007: Formulário de Contato Institucional
* **Descrição:** Canal para dúvidas gerais, palestras, visitas ao campus e contato com a liderança.
* **Validação:** nome (2 a 120 caracteres), e-mail válido, telefone opcional, assunto (2 a 100), mensagem (10 a 3000), consentimento e Turnstile.
* **Saída:** código `CTT-XXXX-XXXX`; os dados ficam cifrados e são retidos por 180 dias ([RN-002-A](business-rules.md)).

### RF-008: Inscrição na Newsletter Ministerial
* **Descrição:** Inscrição com e-mail no rodapé e na Home, com **confirmação dupla** (link enviado por e-mail para `/newsletter/confirmar/`).
* **Validação:** e-mail válido e campo-armadilha (*honeypot*); deduplicação por HMAC do e-mail, sem guardá-lo em claro; funciona também sem JavaScript.

---

## 4. Formação, Conferência & Editora

### RF-009: Página do Curso
* **Descrição:** `/curso/` apresenta a **Formação Superior Sequencial em Sexualidade Humana sob Perspectiva Bíblica**, certificada pela Faculdade Coram Deo: duração, modalidade, corpo docente, chancela SEBI + PLM, público-alvo e temas.
* **Ação:** botão “Falar com Consultor Acadêmico” para o WhatsApp exclusivo do curso (+55 62 9119-1098).

### RF-010: Viagem e Conferência Pure Life Ministries EUA
* **Descrição:** `/viagem-eua/` apresenta a viagem de 20 a 30 de abril de 2027 (Cincinnati, Ohio & Kentucky), a conferência de 23 e 24 de abril, o que está incluso, a programação, os lotes, as observações (visto B1/B2, alimentação não inclusa, crianças até 2 anos) e perguntas frequentes.
* **Ação:** pagamento na plataforma da SEBI e dúvidas pelo WhatsApp pastoral. Dados em `src/data/usa-trip.ts`.

### RF-011: Conferências Anteriores
* **Descrição:** `/conferencia/` e a Home oferecem acesso à playlist oficial das ministrações das conferências anteriores no YouTube.

### RF-012: Catálogo da Editora
* **Descrição:** Exibição das publicações com título, autor, valor, público-alvo, sinopse e botão de pedido pelo WhatsApp da livraria, com mensagem já preenchida.
* **Obras catalogadas:**
  1. *No Altar da Idolatria Sexual* — R$ 65,00 (Steve Gallagher)
  2. *Cria em Mim um Coração Puro* — R$ 55,00 (Kathy Gallagher)
  3. *O Impacto Pessoal e Social da Pornografia* — R$ 45,00 (Pr. Paulo Adriano Muniz Gouvêa)
  4. *As 20 Verdades que me Ajudaram contra o Vício em Pornografia* — R$ 75,00 (Steve Gallagher)
  5. *Curando a Dor da Traição no Casamento* — R$ 55,00 (Kathy Gallagher)
  6. *Trauma Redimido* — R$ 85,00 (Pure Life Ministries)
  7. *Pilha de Máscaras — Expondo a Hipocrisia Cristã* — R$ 50,00 (Dustin Renz; capa real e ficha técnica)
  8. *Contaminados com a Babilônia* — R$ 45,00 (Steve Gallagher)
  9. *Eu, a Raiz Exposta do Pecado* — R$ 50,00 (Steve Gallagher)

---

## 5. Programas, Institucional & Mídia

### RF-013: Programas de Aconselhamento
* **Descrição:** A Home e `/programas/` exibem dois programas a partir de `src/data/programs.ts`:
  * **Programa Residencial** — 9 meses em Águas Lindas de Goiás; inscrição R$ 500,00 somente após aprovação; mensalidade R$ 1.200,00 (hospedagem, alimentação, livros e aconselhamento); entrada pela triagem.
  * **Online Vida Pura** — sessões semanais ao vivo; inscrição pela plataforma Hotmart (link externo em nova aba).

### RF-014: Biblioteca Multimídia e Integração com YouTube
* **Descrição:** Vídeo em destaque, pregações, conferências e testemunhos com miniaturas oficiais e links para o canal `@purelifebrasil`. Não há player incorporado: nenhum script do YouTube é carregado.

### RF-015: Linha do Tempo do Ministério
* **Descrição:** `/sobre/` exibe a história do ministério (1986–2023) numa linha do tempo horizontal, navegável por botões e pelas setas do teclado, com os marcos do Brasil em destaque. Dados em `src/data/timeline.ts`.

### RF-016: Galeria do Campus
* **Descrição:** `/campus/` exibe as fotos reais da sede em Águas Lindas de Goiás, com texto alternativo descritivo em cada imagem.

### RF-017: Redirecionamentos do Site Antigo
* **Descrição:** Todo endereço público do site antigo (WordPress) responde com `301` para a página equivalente do site novo (`public/_redirects`). Ver [Migração do Site Antigo](../operations/legacy-migration.md).

---

## 6. Gestão Pastoral

### RF-018: Caixa Pastoral Auditada
* **Descrição:** A equipe autorizada lista, lê e atualiza o status de triagens e contatos pela CLI `scripts/pastoral-inbox.mjs`, que decifra localmente.
* **Regras:** toda leitura exige motivo (`--reason`) e é registrada em `audit_events` com o operador; status possíveis: `in_review`, `contacted` e `closed`.
