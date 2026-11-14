// Análise estática de segurança (SAST): eslint-plugin-security
// Executado separadamente do lint de qualidade: npm run security:sast
import security from 'eslint-plugin-security';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', 'coverage/'] },
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tseslint.parser },
    ...security.configs.recommended,
    rules: {
      ...security.configs.recommended.rules,
      // Todas as regras do plugin passam a bloquear o pipeline
      ...Object.fromEntries(Object.keys(security.configs.recommended.rules).map((r) => [r, 'error'])),
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
  },
);
