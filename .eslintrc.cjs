// ============================================================================
// MICROSOFT ESLINT CONFIGURATION - Enterprise Standard
// ============================================================================

module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'import'],
  rules: {
    // Microsoft Pattern: Relaxed rules for rapid development
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-enum-comparison': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/prefer-optional-chain': 'off',
    '@typescript-eslint/require-await': 'off',
    '@typescript-eslint/no-redundant-type-constituents': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    'no-console': 'off',
    'no-empty': 'off',
    'no-constant-condition': 'off',
    'no-async-promise-executor': 'off',
    'react/no-unescaped-entities': 'off',
    'react/jsx-no-comment-textnodes': 'off',
    'import/order': 'off',
    'import/default': 'off',
    
    // Microsoft Standards: Code quality (React components infer return types)
    '@typescript-eslint/explicit-function-return-type': 'off', // React components have inferred JSX.Element return type
    '@typescript-eslint/naming-convention': [
      'warn',
      {
        selector: 'interface',
        format: ['PascalCase'],
      },
      {
        selector: 'typeAlias',
        format: ['PascalCase'],
      },
    ],
    
    // React best practices
    'react/prop-types': 'off', // Using TypeScript
    'react-hooks/rules-of-hooks': 'warn',
    'react-hooks/exhaustive-deps': 'off', // Too noisy for large codebase
    
    // General code quality
    'no-unused-vars': 'off', // Using TypeScript version
    '@typescript-eslint/no-unused-vars': 'off', // TypeScript catches this
    'prefer-const': 'off', // Let developer choose
    'no-var': 'warn',
    'import/no-named-as-default': 'off',
    'import/no-named-as-default-member': 'off',
    
    // SSOT enforcement: Prohibit non-SSOT branding imports
    // Note: Set to 'warn' for one release cycle; will flip to 'error' in next sprint
    'no-restricted-imports': ['warn', {
      'paths': [{
        'name': '@/components/icons/AdvancedBrandSettings',
        'message': 'Use SSOT: @/components/theme/AdvancedBrandingSettings'
      }, {
        'name': '../icons/AdvancedBrandSettings',
        'message': 'Use SSOT: @/components/theme/AdvancedBrandingSettings'
      }, {
        'name': '../../icons/AdvancedBrandSettings',
        'message': 'Use SSOT: @/components/theme/AdvancedBrandingSettings'
      }]
    }],
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
  ignorePatterns: ['dist', 'node_modules', '*.cjs', 'vite.config.ts'],
};
