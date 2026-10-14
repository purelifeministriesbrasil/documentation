# Procedimento de Rotação de Chaves e Segredos

Rotacione a cada 12 meses, quando um membro com acesso deixar a equipe, ou **imediatamente** diante de qualquer
suspeita de exposição.

---

## 1. Chave de cifra de campo (`TRIAGE_KEY_Vn`)

O Worker mantém um chaveiro: lê todas as variáveis `TRIAGE_KEY_V1`, `TRIAGE_KEY_V2`, … e cifra novos dados com
`TRIAGE_KEY_CURRENT_VERSION`. Cada registro guarda sua `key_version`, e o AAD inclui a versão — dados antigos
continuam legíveis com a chave antiga.

```bash
openssl rand -base64 32                       # nova chave → cofre da organização
cd backend
pnpm exec wrangler secret put TRIAGE_KEY_V2
# wrangler.toml: TRIAGE_KEY_CURRENT_VERSION = "2"
pnpm deploy
```

Verificação: envie uma triagem de teste e confirme `key_version = 2` no banco.

**Quando a chave antiga pode ser removida**: triagens e contatos são expurgados após 180 dias, mas e-mails de
newsletter e de doadores **não expiram**. Mantenha `TRIAGE_KEY_V1` no Worker e no cofre enquanto existir qualquer
linha com `key_version = 1`:

```sql
select 'triage' t, count(*) from triage_submissions where key_version = 1
union all select 'contact', count(*) from contact_submissions where key_version = 1
union all select 'newsletter', count(*) from newsletter_subscriptions where key_version = 1
union all select 'donation', count(*) from donation_intents where key_version = 1;
```

!!! danger "Exposição de chave"
    Se uma chave **vazou**, adicionar uma nova não protege os dados antigos. É preciso re-cifrar os registros
    existentes (decifrar com Vn, cifrar com Vn+1 com o novo AAD) — operação ainda não automatizada; trate como
    incidente de segurança.

## 2. Pepper de e-mail (`HASH_PEPPER`)

Trocar o pepper invalida a deduplicação: o mesmo e-mail passa a gerar outro `email_hash`. Rotacione apenas em caso
de exposição; nesse cenário, recalcule os hashes decifrando os e-mails (script manual) ou aceite reconfirmações.

## 3. Segredos de integrações

| Segredo | Onde gerar | Passos |
|---|---|---|
| `DATABASE_URL` | Supabase → *Database* → *Reset database password* | `wrangler secret put DATABASE_URL` e atualize o cofre |
| `TURNSTILE_SECRET_KEY` | Cloudflare → Turnstile → widget → *Rotate secret* | `wrangler secret put TURNSTILE_SECRET_KEY` |
| `RESEND_API_KEY` | Resend → API Keys | Crie a nova, publique com `wrangler secret put`, depois revogue a antiga |
| `ASAAS_API_KEY` / `ASAAS_WEBHOOK_SECRET` | Asaas → Integrações | Atualize o token no cadastro do webhook **e** no Worker na mesma janela |
| `MERCADOPAGO_*` | Mercado Pago → Suas integrações | Renove credenciais / assinatura secreta e publique no Worker |

`wrangler secret put` publica uma nova versão do Worker imediatamente; não é preciso `pnpm deploy`.
