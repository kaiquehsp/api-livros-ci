# API de Livros — CI com GitHub Actions

API REST (Node.js 22 + TypeScript + Express 5) com banco de dados SQL (PostgreSQL 16) e pipeline de
Integração Contínua disparado por Pull Request.

## Endpoints

| Método | Rota              | Descrição                         |
| ------ | ----------------- | --------------------------------- |
| GET    | `/health`         | Status da API e da conexão com BD |
| GET    | `/api/livros`     | Lista livros                      |
| GET    | `/api/livros/:id` | Busca livro por id                |
| POST   | `/api/livros`     | Cria livro                        |
| PUT    | `/api/livros/:id` | Atualiza parcialmente             |
| DELETE | `/api/livros/:id` | Remove livro                      |

Exemplo de corpo:

```json
{ "titulo": "Vidas Secas", "autor": "Graciliano Ramos", "isbn": "978-85-01-01434-8", "anoPublicacao": 1938 }
```

## Pipeline de CI (`.github/workflows/ci.yml`)

Gatilho: `pull_request` para `main` (`opened`, `synchronize`, `reopened`). Um único job sequencial:

| #   | Etapa                         | Ferramenta / comando                                    |
| --- | ----------------------------- | ------------------------------------------------------- |
| 1   | Análise estática de código    | ESLint + typescript-eslint — `npm run lint`             |
| 2   | Análise de formatação         | Prettier — `npm run format:check`                       |
| 3   | Análise estática de segurança | eslint-plugin-security (SAST) — `npm run security:sast` |
| 4   | Auditoria de dependências     | npm audit — `npm run security:deps`                     |
| 5   | Build                         | TypeScript (`tsc`) — `npm run build`                    |
| 6   | Testes unitários              | Vitest — `npm run test:unit`                            |
| 7   | Testes de integração          | Vitest + Supertest + PostgreSQL (service container)     |
| 8   | Criação de imagem             | Docker Buildx (`push: false`) + smoke test do container |

## Executar localmente

```bash
cp .env.example .env
docker compose up --build        # API em http://localhost:3000
```

Sem Docker: `npm ci`, suba um PostgreSQL, exporte `DATABASE_URL` e rode `npm run dev`.

Rodar as etapas do CI na máquina: `DATABASE_URL=postgres://... ./scripts/ci-local.sh`

## Como disparar o CI

```bash
git checkout -b feature/minha-alteracao
# ... alterações ...
git push -u origin feature/minha-alteracao
# abrir Pull Request para main → aba "Checks" do PR ou aba "Actions"
```
