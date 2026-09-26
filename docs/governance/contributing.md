# Guia de Contribuição — purelife-docs

Agradecemos o seu interesse em contribuir para a documentação técnica e arquitetural do **Pure Life Ministries Brasil**!

A documentação é a fonte da verdade para todo o ecossistema tecnológico. Por esse motivo, exigimos rigor técnico, precisão conceitual e clareza didática.

---

## 1. Diretrizes de Contribuição

1. **Documento Canónico**:
   - Toda proposta de alteração estrutural ou arquitetural deve estar em harmonia com a arquitetura ativa do ecossistema.
   - Novas decisões arquiteturais significativas exigem a elaboração de um **ADR (Architecture Decision Record)** numerado na pasta `docs/adrs/`.

2. **Formatação e Padrões**:
   - Todos os arquivos devem estar em Markdown com codificação UTF-8 pura.
   - Utilize a sintaxe de callouts/admonitions do MkDocs Material (`!!! note`, `!!! warning`, `!!! tip`).
   - Diagramas de fluxo e arquiteturais devem utilizar blocos Mermaid (````mermaid ... ````).
   - Ao adicionar novas páginas ou pastas, atualize o arquivo `mkdocs.yml` na seção `nav`.

3. **Fluxo de Trabalho Git**:
   - Crie uma branch descritiva a partir de `main`:
     ```bash
     git checkout -b docs/nova-secao-ou-correcao
     ```
   - Faça commits semânticos atômicos (seguindo *Conventional Commits*):
     - `docs(adrs): add ADR-006 detailing event streaming`
     - `fix(compliance): correct retention days in LGPD guide`
   - Abra um Pull Request detalhando a motivação da alteração e o impacto nos repositórios do ecossistema.

---

## 2. Validação Local com MkDocs

Para validar as alterações localmente antes de submeter o Pull Request:

```bash
# 1. Instalar as dependências no ambiente virtual Python
pip install -r requirements.txt

# 2. Executar o servidor de desenvolvimento
mkdocs serve

# 3. Validar compilação estrita (sem links quebrados)
mkdocs build --strict
```

Acesse `http://127.0.0.1:8000` e verifique a integridade dos links e da barra de navegação.
