import { defineConfig } from 'vitest/config';

// Testes unitários: rápidos, sem banco de dados
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    reporters: ['verbose'],
  },
});
