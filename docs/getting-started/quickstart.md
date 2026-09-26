# Guia do Desenvolvedor (Quickstart)

Este guia orienta a configuração do ambiente de desenvolvimento local para o ecossistema digital da **Pure Life Ministries Brasil** em menos de 5 minutos.

---

## 1. Pré-requisitos de Sistema

Certifique-se de ter as seguintes ferramentas instaladas:

- **Node.js**: v22 LTS ou superior.
- **pnpm**: v9 ou v10 (`npm install -g pnpm`).
- **Git**: v2.40+ configurado.
- **Python**: v3.11+ (necessário apenas para rodar a documentação MkDocs localmente).

---

## 2. Clonando os Repositórios

Recomendamos clonar os repositórios em uma pasta compartilhada:

```bash
mkdir purelifeministriesbrasil && cd purelifeministriesbrasil

# Frontend institucional
git clone https://github.com/purelifeministriesbrasil/frontend.git

# Backend auxiliar de pagamentos e jobs
git clone https://github.com/purelifeministriesbrasil/backend.git

# Portal de documentação oficial
git clone https://github.com/purelifeministriesbrasil/documentation.git
```

---

## 3. Configurando o Frontend

Entre na pasta do frontend, instale as dependências e inicie o servidor de desenvolvimento:

```bash
cd frontend

# Instalação das dependências otimizada com pnpm
pnpm install

# Copie o template de variáveis de ambiente
cp .env.example .env

# Inicie o servidor de desenvolvimento Astro
pnpm dev
```

O site estará acessível em: `http://localhost:4321`.

### Comandos Principais do Frontend

| Comando | Finalidade |
| :--- | :--- |
| `pnpm dev` | Inicia o servidor local de desenvolvimento com Hot Module Replacement (HMR) |
| `pnpm build` | Gera o build estático de produção em `dist/` |
| `pnpm preview` | Executa um servidor local servindo a pasta `dist/` compilada |
| `pnpm ci:verify` | Executa o quality gate completo: build + validação de topologia + verificação de CSS inline |

---

## 4. Configurando a Documentação Local (MkDocs)

Para editar e visualizar esta documentação com recarregamento em tempo real:

```bash
cd documentation

# Criação do ambiente virtual Python
python -m venv .venv

# Ativação do ambiente
# No Windows (PowerShell):
.venv\Scripts\Activate.ps1
# No Linux/macOS:
source .venv/bin/activate

# Instalação dos pacotes
pip install -r requirements.txt

# Inicialização do servidor MkDocs com live-reload
mkdocs serve
```

Acesse a documentação interativa em: `http://127.0.0.1:8000`.

---

## 5. Checklist de Boas Práticas antes de Abrir um Pull Request

Antes de enviar commits para revisão:

- [ ] Executar `pnpm ci:verify` no frontend e certificar-se de que todas as 16 rotas estáticas foram compiladas com sucesso.
- [ ] Confirmar que nenhum estilo inline residual foi adicionado.
- [ ] Garantir que nenhum segredo (`.env`, tokens de API ou credenciais) foi incluído no commit.
- [ ] Seguir o padrão de commits canónicos (*Conventional Commits*), por exemplo: `feat:`, `fix:`, `docs:`, `chore:`.
