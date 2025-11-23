// ESLint v9 flat config for TypeScript + React (ESM)
// See: https://typescript-eslint.io/getting-started/typed-linting/

import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default [
  // Global linter options
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off'
    }
  },
  {
    ignores: [
      'dist/**',
      'playwright-report/**',
      'test-results/**',
      'node_modules/**',
      'public/**',
      'artifacts/**',
      'retired_files/**',
      // Generated or externalized types; lint lightly later
      'src/types/**'
    ]
  },
  js.configs.recommended,
  // Node scripts: recognize Node globals and common patterns
  {
    files: ['scripts/**/*.{js,mjs,ts}'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    },
    rules: {
      // Script utilities often log intentionally
      'no-console': 'off',
      // Allow CommonJS in .js files (require/module)
      'no-undef': 'off'
    }
  },
  ...tseslint.config({
    files: ['**/*.{ts,tsx}'],
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks
    },
    rules: {
      // React
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      // Disable exhaustive-deps for now due to numerous false positives with Zustand store hooks
      'react-hooks/exhaustive-deps': 'off',

      // TypeScript
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none', ignoreRestSiblings: true }],
  '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
      '@typescript-eslint/no-inferrable-types': 'off',
  '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/consistent-generic-constructors': 'off',
      '@typescript-eslint/prefer-function-type': 'off',
      '@typescript-eslint/consistent-indexed-object-style': 'off',
  '@typescript-eslint/consistent-type-definitions': ['warn', 'interface'],
      '@typescript-eslint/ban-ts-comment': ['warn', { 'ts-ignore': 'allow-with-description' }],
      '@typescript-eslint/no-empty-function': 'off',

      // General
      // Allow console usage broadly; consider migrating to structured logger later
      'no-console': 'off',
      'no-empty': 'off',
      'no-async-promise-executor': 'error',
  'no-constant-condition': 'warn'
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  }),
  // Test files overrides: relax React Hooks and typing strictness for Playwright/Vitest
  {
    files: [
      'tests/**/*.{ts,tsx}',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      'src/**/__tests__/**/*.{ts,tsx}'
    ],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/consistent-generic-constructors': 'off'
    }
  },
  // Final global softeners to keep broadened lint green during migration
  {
    files: ['**/*.{ts,tsx,js,mjs}'],
    rules: {
      'no-empty-function': 'off',
      'no-constant-condition': 'warn',
      'prefer-const': 'warn'
    }
  }
];

