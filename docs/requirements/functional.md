# Requisitos Funcionais (RFs)

Catálogo detalhado das capacidades e comportamentos operacionais do ecossistema digital da **Pure Life Ministries Brasil**.

---

## 1. Núcleo de Aconselhamento Bíblico & Triagem

### RF-001: Submissão de Triagem Confidencial
* **Descrição:** O sistema deve permitir que qualquer pessoa submeta uma solicitação confidencial de ajuda através do formulário de triagem.
* **Entradas:** Nome completo, e-mail válido, telefone/WhatsApp (opcional), programa de interesse, perfil do solicitante, relato pastoral (opcional, máx. 2000 caracteres), confirmação de maioridade legal (18+) e consentimento explícito com a Política de Privacidade.
* **Comportamento:** O relato pastoral e campos confidenciais devem ser cifrados via AES-256-GCM antes de persistir no banco.
* **Saída:** Código de referência único gerado para acompanhamento (ex: `PLM-2026-XXXX`).

### RF-002: Verificação Anti-Bot na Borda
* **Descrição:** Todas as submissões públicas (triagem, contato, doação, newsletter) devem ser protegidas pelo Cloudflare Turnstile de forma transparente, sem captchas manuais intrusivos.
* **Comportamento:** Se o token Turnstile for inválido ou ausente, a requisição é rejeitada com código `403 Forbidden` sem tocar no banco de dados.

### RF-003: Confirmação e Acolhimento Imediato
* **Descrição:** Após o recebimento com sucesso, o sistema deve exibir a tela de confirmação (`/triagem/recebido/`) reforçando o compromisso de sigilo e informando o prazo de contato pastoral.

---

## 2. Sustentabilidade Financeira & Doações

### RF-004: Geração de Doação via PIX Dinâmico
* **Descrição:** O sistema deve gerar um QR Code PIX e código copia-e-cola com valor personalizado ou pré-definido (R$ 30, R$ 50, R$ 100, R$ 250 ou valor livre).
* **Comportamento:** O backend cria a cobrança via Asaas/Mercado Pago e retorna o payload com expiração configurada para 60 minutos.
* **Saída:** Código PIX copia-e-cola, imagem do QR Code e identificador da intenção no Supabase.

### RF-005: Conciliação de Pagamento via Webhook
* **Descrição:** O backend deve processar notificações assíncronas do gateway bancário quando o pagamento for liquidado.
* **Comportamento:** Valida a assinatura HMAC-SHA256 do cabeçalho; adquire um lease transacional atômico (`pg_try_advisory_xact_lock`) e atualiza o status para `confirmado` sem permitir duplicidade.

---

## 3. Comunicação & Contato Geral

### RF-006: Formulário de Contato Institucional
* **Descrição:** Canal para dúvidas gerais, solicitação de palestras, informações sobre campus e contato com a liderança ministerial.
* **Validação:** Nome (mín. 2 chars), e-mail válido, mensagem (mín. 5 chars, máx. 2000 chars), Turnstile ativo.

### RF-007: Inscrição na Newsletter Ministerial
* **Descrição:** Inscrição rápida no rodapé ou páginas internas informando apenas o e-mail para receber devocionais e notícias das turmas.
* **Validação:** E-mail com formato válido, deduplicação automática (`ON CONFLICT DO NOTHING`).

---

## 4. Conferência & Eventos

### RF-008: Inscrição em Conferência Nacional
* **Descrição:** O portal deve disponibilizar informações detalhadas (local, preletores, cronograma e lotes) e formulário de inscrição para o evento anual.

### RF-009: Catálogo de Literatura da Editora
* **Descrição:** Exibição estruturada das 9 publicações oficiais da Editora Pure Life com título, autor, valor tabelado (de R$ 45,00 a R$ 85,00), público-alvo específico, sinopse bíblica e link direto para solicitação individual ou em lotes para igrejas e livrarias.
* **Obras Catalogadas:**
  1. *Cria em Mim um Coração Puro* — R$ 55,00 (Mulheres / Kathy Gallagher)
  2. *No Altar da Idolatria Sexual* — R$ 65,00 (Homens / Steve Gallagher)
  3. *O Impacto Pessoal e Social da Pornografia* — R$ 45,00 (Geral / Pr. Paulo Gouvêa)
  4. *As 20 Verdades Contra o Vício em Pornografia* — R$ 75,00 (Devocional / Steve Gallagher)
  5. *Curando a Dor da Traição no Casamento* — R$ 55,00 (Esposas Traídas / Kathy Gallagher)
  6. *Trauma Redimido* — R$ 85,00 (Restauração / PLM)
  7. *Pilha de Máscaras* — R$ 50,00 (Igreja & Liderança / Steve Gallagher)
  8. *Contaminados com a Babilônia* — R$ 45,00 (Igreja & Cultura / Steve Gallagher)
  9. *Eu, a Raiz Exposta do Pecado* — R$ 50,00 (Vida Cristã / Steve Gallagher)

---

## 5. Programa Residencial & Recursos Multimídia

### RF-010: Programa Residencial de Imersão (9 Meses)
* **Descrição:** Especificação formal do programa presencial em Águas Lindas de Goiás:
  * **Duração:** 09 meses integrais de recolhimento e discipulado bíblico.
  * **Taxa de Inscrição:** R$ 500,00 (avaliação pastoral e triagem inicial).
  * **Mensalidade:** R$ 1.200,00 (hospedagem no campus, alimentação completa, materiais didáticos e aconselhamento semanal individual).
  * **Fluxo de Entrada:** Exige preenchimento prévio e aprovação na triagem confidencial.

### RF-011: Biblioteca Multimídia e Integração com YouTube
* **Descrição:** Disponibilização integrada de pregações, estudos bíblicos, ministrações em conferências (MEVAM Curitiba, Igreja Dókimos, HNT) e testemunhos de restauração (IECBR Reaviva, Sexo sem Cativeiro) com capas oficiais em alta definição e links diretos para o canal institucional.
