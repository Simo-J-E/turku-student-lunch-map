import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/.wrangler/**', '**/node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['frontend/src/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    rules: { '@typescript-eslint/no-explicit-any': 'error' }
  },
  {
    files: ['worker/src/**/*.ts', 'shared/**/*.ts'],
    languageOptions: { globals: { ...globals.worker } },
    rules: { '@typescript-eslint/no-explicit-any': 'error' }
  }
);
