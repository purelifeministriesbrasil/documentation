# Guia de Estilo da Documentação

Padrão para todas as páginas deste site e para os READMEs dos três repositórios.

## Estrutura de uma página

1. **Título (H1)** com o nome do assunto, sem prefixos como "Documento de" ou "Guia completo de".
2. **Resumo** logo abaixo, num bloco `!!! abstract`, dizendo para quem é a página e quando usá-la.
3. **Seções H2** curtas e em ordem de uso (o que fazer primeiro vem primeiro).
4. **Referências** no fim, com links relativos para páginas relacionadas.

## Escrita

| Regra | Exemplo |
|---|---|
| Português do Brasil, frases curtas, voz ativa | "Rode o comando" em vez de "O comando deverá ser rodado" |
| Tabelas para comparações e listas de arquivos/comandos | — |
| Um comando por bloco de código `bash` | facilita copiar |
| Nomes de arquivos, variáveis e comandos em `código` | `wrangler.toml`, `PUBLIC_API_URL` |
| Datas absolutas | "12/11/2026", nunca "semana passada" |
| Estado real, não desejado | escreva "pendente" quando algo depende de deploy ou decisão |
| Nunca incluir segredos | só **nomes** de variáveis e secrets |

## Avisos (admonitions)

| Tipo | Uso |
|---|---|
| `!!! abstract` | resumo no topo |
| `!!! info` | contexto útil |
| `!!! warning` | risco ou pré-requisito |
| `!!! danger` | ação irreversível, produção ou dados pessoais |

## READMEs dos repositórios

Mesmas seções, na mesma ordem, nos três repositórios: Sumário · 1. Visão geral · 2. Início rápido ·
3. Comandos · 4. Estrutura do repositório · 5. Configuração · 6. Qualidade e CI · 7. Publicação e
reversão · 8. Manutenção · 9. Governança.

## ADRs

- Numeração sequencial (`ADR-NNN-titulo.md`); o próximo número livre está em [Decisões de Arquitetura](../adrs/index.md).
- Uma ADR aprovada **não é reescrita**: decisões novas geram ADR nova, e a antiga recebe o status
  *Substituído* com link para a sucessora.

## Antes de abrir o PR

```bash
uv run --with-requirements requirements.txt mkdocs build --strict
```

Links quebrados ou avisos fazem o check **mkdocs build --strict** falhar.
