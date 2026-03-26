const { defineConfig } = require('eslint/config');
const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const react = require('eslint-plugin-react');
const reactNative = require('eslint-plugin-react-native');
const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const jest = require('eslint-plugin-jest');
const prettier = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');
const globals = require('globals');
const espree = require('espree');

module.exports = defineConfig([
  // Global ignores
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.expo/**',
      '**/ios/**',
      '**/android/**',
      '**/web-build/**',
      '**/*.config.js',
      '**/coverage/**',
      '**/.metro-health-check*',
      '**/expo-env.d.ts',
      'components/ui/**/*.tsx',
      'components/ui/**/*.ts',
      'scripts/**/*.ts',
    ],
  },
  // Base JavaScript config
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react,
      'react-native': reactNative,
      jest,
      prettier,
    },
    rules: {
      ...js.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react-native/no-unused-styles': 'warn',
      'react-native/split-platform-components': 'warn',
      'react-native/no-inline-styles': 'warn',
      'react-native/no-color-literals': 'warn',
      'prettier/prettier': 'error',
      'react/no-unescaped-entities': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  // TypeScript config
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest,
        ...globals.es2021,
      },
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.eslint.json',
        warnOnUnsupportedTypeScriptVersion: false,
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      react,
      'react-native': reactNative,
      jest,
      prettier,
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      ...prettierConfig.rules,
      'react/react-in-jsx-scope': 'off',
      'react-native/no-unused-styles': 'warn',
      'react-native/split-platform-components': 'warn',
      'react-native/no-inline-styles': 'warn',
      'react-native/no-color-literals': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'prettier/prettier': 'error',
      'react/no-unescaped-entities': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  // Jest test files
  {
    files: [
      '**/__tests__/**',
      '**/*.test.{js,jsx,ts,tsx}',
      '**/*.spec.{js,jsx,ts,tsx}',
    ],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    plugins: {
      jest,
    },
    rules: {
      ...jest.configs.recommended.rules,
    },
  },
  // JavaScript Config files (Node.js environment)
  {
    files: ['eslint.config.js', '*.config.js', '.eslintrc.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parser: espree,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  // TypeScript Config files (app.config.ts, etc.)
  {
    files: ['*.config.ts', 'app.config.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.eslint.json',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  // Jest test files
  {
    files: [
      '**/__tests__/**',
      '**/*.test.{js,jsx,ts,tsx}',
      '**/*.spec.{js,jsx,ts,tsx}',
    ],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    plugins: {
      jest,
    },
    rules: {
      ...jest.configs.recommended.rules,
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
]);