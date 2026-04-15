import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

// ESLint 9 flat config.
// Engram is all .jsx (no TypeScript), React 18, Vite, browser + service worker runtime.
// Keep this strict enough to catch real bugs but not so noisy that `--max-warnings=0`
// blocks routine work — tune by promoting warn → error as signals appear in CI history.

export default [
  {
    ignores: [
      'dist/**',
      'dev-dist/**',
      'node_modules/**',
      'public/**',
      'supabase/functions/**', // Deno runtime, different rules
      'scripts/**',             // Node one-shots, not worth linting
      '**/*.min.js',
    ],
  },

  js.configs.recommended,

  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: '18.3' },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules, // React 17+ automatic JSX runtime — no React import needed
      ...reactHooks.configs.recommended.rules,

      // React 18 + automatic runtime lets us skip these
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off', // No prop-types in deps; project relies on Zustand + inline typing conventions

      // Real-bug rules
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      }],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'react/jsx-key': 'error',
      'react/jsx-no-target-blank': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Vite config + root JS files run in Node
  {
    files: ['vite.config.js', '*.config.js', '*.config.mjs'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
];
