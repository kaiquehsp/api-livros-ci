#!/usr/bin/env sh
# Executa localmente as mesmas etapas do workflow de CI, na mesma ordem.
# Requer: Node 22, Docker e um PostgreSQL acessível em $DATABASE_URL.
set -eu

: "${DATABASE_URL:?defina DATABASE_URL, ex.: postgres://livros:livros@localhost:5432/livros_test}"
TAG="${TAG:-api-livros:local}"

etapa() {
  printf '\n\033[1;34m==> %s\033[0m\n' "$1"
}

etapa 'Instalar dependencias' && npm ci
etapa 'Analise estatica de codigo (ESLint)' && npm run lint
etapa 'Analise de formatacao (Prettier)' && npm run format:check
etapa 'Analise estatica de seguranca (SAST)' && npm run security:sast
etapa 'Auditoria de dependencias (npm audit)' && npm run security:deps
etapa 'Build da aplicacao (TypeScript)' && npm run build
etapa 'Testes unitarios' && npm run test:unit
etapa 'Testes de integracao (API + PostgreSQL)' && npm run test:integration
etapa 'Criar imagem Docker' && docker build -t "$TAG" .

printf '\n\033[1;32mCI local concluido com sucesso.\033[0m\n'
