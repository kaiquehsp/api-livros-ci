import { defineConfig } from 'vitest/config';

// Testes de integração: API HTTP + PostgreSQL real (DATABASE_URL)
export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    environment: 'node',
    reporters: ['verbose'],
    fileParallelism: false,
    testTimeout: 15000,
  },
});
