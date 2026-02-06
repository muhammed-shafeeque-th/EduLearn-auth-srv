import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import typescript from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-plugin-prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: {},
  allConfig: {},
});

export default [
  {
    ignores: [
      'node_modules/',
      'dist/',
      'coverage/',
      'src/infrastructure/frameworks/gRPC/generated/*',
      'protogen.sh',
    ],
  },
  ...compat.extends(
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'eslint-config-prettier',
  ),
  {
    files: ['**/*.{ts,tsx}', '**/*.{ts,tsx}/**'],
    plugins: {
      '@typescript-eslint': typescript,
      prettier: prettier,
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-duplicate-enum-values': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-member-accessibility': ['warn'],
      '@typescript-eslint/no-non-null-assertion': 'off',
      'prettier/prettier': 'error',
      'no-var': 'warn', // Added rule to warn against using var for variable declaration
    },
  },
];
