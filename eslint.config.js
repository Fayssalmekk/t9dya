import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist', 'node_modules', 'android/app/build', 'android/app/src/main/assets'] },
  js.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    files: ['api/**/*.js', 'scripts/**/*.js', 'vite.config.js'],
    languageOptions: {
      ecmaVersion: 2024,
      globals: globals.node,
      parserOptions: { sourceType: 'module' }
    }
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module'
      }
    },
    plugins: {
      'react-refresh': reactRefresh
    },
    rules: {
      'no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^[A-Z_]',
          argsIgnorePattern: '^[A-Z_]',
          destructuredArrayIgnorePattern: '^_'
        }
      ],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }]
    }
  }
]
