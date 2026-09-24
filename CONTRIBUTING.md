# Guia de Contribuição — purelife-docs

Agradecemos o seu interesse em contribuir para a documentação técnica e arquitetural do **Pure Life Ministries Brasil**!

A documentação é a fonte da verdade para todo o ecossistema tecnológico. Por esse motivo, exigimos rigor técnico, precisão conceitual e clareza didática.

---

## Diretrizes e Checklist

Diretrizes de Contribuição

1. **Documento Canónico**:
   - Toda proposta de alteração estrutural ou arquitetural deve estar em harmonia com a Especificação Técnica v5.0 (`arquitetura-purelife-v5.md`).
   - Novas decisões arquiteturais significativas exigem a elaboração de um **ADR (Architecture Decision Record)** numerado na pasta `adrs/`.

2. **Formatação e Padrões**:
   - Todos os arquivos devem estar em Markdown com codificação UTF-8 pura.
   - Utilize a sintaxe de callouts suportada nativamente pelo Mintlify (`> [!NOTE]`, `> [!WARNING]`, `> [!IMPORTANT]`, etc.).
   - Diagramas de fluxo e arquiteturais devem utilizar blocos Mermaid (````mermaid ... ````).
   - Ao adicionar novas páginas ou pastas, atualize o arquivo `mint.json` para refletir o novo documento na navegação.

3. **Fluxo de Trabalho Git**:
   - Crie uma branch descritiva a partir de `main`:
     ```bash
     git checkout -b docs/nova-secao-ou-correcao
     ```
   - Faça commits semânticos atômicos (seguindo Conventional Commits):
     - `docs: add ADR-006 detailing event streaming`
     - `fix(compliance): correct retention days in LGPD guide`
   - Abra um Pull Request detalhando a motivação da alteração e o impacto nas implementações dos outros repositórios.

---

## Validação Local

Visualização Local com Mintlify

Para validar as alterações localmente antes de submeter o Pull Request:
```bash
# 1. Instalar a CLI do Mintlify
npm i -g mintlify

# 2. Executar o servidor de desenvolvimento
mintlify dev
```
Acesse `http://localhost:3000` e verifique a integridade dos links e da barra de navegação.
