# Esquema de Validação: Formulário de Triagem Confidencial

O esquema de triagem valida os dados de admissão e pedidos de ajuda confidencial antes de qualquer inserção no banco de dados.

Localização do código-fonte: [`frontend/src/schemas/triage/schema.ts`](file:///c:/Users/pedrohpsantos/Documents/purelifeministriesbrasil/frontend/src/schemas/triage/schema.ts)

---

## 1. Definição do Esquema Zod

```typescript
import { z } from "zod";

export const triageSubmissionSchema = z.object({
  // Confirmação obrigatória de maioridade
  isAdult: z.literal(true, {
    errorMap: () => ({ message: "Este formulário é destinado a maiores de 18 anos." }),
  }),
  
  // Programa de interesse pastoral
  programInterest: z.enum(["residencial", "online", "esposas", "indefinido"]),
  
  // Perfil de quem está submetendo
  profile: z.enum(["para_mim", "para_meu_conjuge", "para_um_familiar", "sou_lider"]),

  // Dados de contato
  fullName: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(160),
  phone: z.string().trim().regex(/^\+?\d{10,15}$/, "Telefone deve conter de 10 a 15 dígitos com DDD").optional(),
  contactChannel: z.enum(["email", "telefone", "whatsapp"]),

  // Relato confidencial opcional por desenho (privacidade)
  report: z.string().trim().max(2000, "Relato não pode exceder 2000 caracteres").optional(),

  // Consentimento e proteção anti-bot
  consent: z.literal(true, {
    errorMap: () => ({ message: "É necessário concordar com a Política de Privacidade." }),
  }),
  policyVersion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Versão da política deve estar no formato YYYY-MM-DD"),
  turnstileToken: z.string().min(10).max(2048),
}).strict();

export type TriageSubmission = z.infer<typeof triageSubmissionSchema>;
```

---

## 2. Invariantes de Negócio e Segurança

1. **Maioridade Estrita (`isAdult`)**: Apenas maiores de 18 anos podem submeter triagens diretamente pelo site. O esquema rejeita qualquer payload onde `isAdult !== true`.
2. **Relato Opcional por Desenho (`report`)**: O campo de relato pessoal é intencionalmente opcional. O assistido não é coagido a relatar detalhes íntimos para solicitar atendimento pastoral preliminar.
3. **Modo Estrito (`.strict()`)**: Quaisquer campos adicionais não mapeados são sumariamente descartados e geram erro de validação (prevenção contra ataques de poluição de propriedades).
