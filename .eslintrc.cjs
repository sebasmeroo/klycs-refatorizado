module.exports = {
  root: true,
  env: { 
    browser: true, 
    es2022: true,
    node: true 
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'build', 'lib', '.eslintrc.cjs', 'node_modules', 'vite.config.ts'],
  plugins: ['react-refresh', '@typescript-eslint'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    'no-console': 'off',
    'no-undef': 'off',
    'import/no-duplicates': 'off',
    'prefer-const': 'off',
    'no-var': 'off',
    'object-shorthand': 'off',
    'quote-props': 'off',
    'no-useless-escape': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    'react-hooks/rules-of-hooks': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'react-refresh/only-export-components': 'off',
    'no-useless-catch': 'off',
    'no-case-declarations': 'off',
    'no-prototype-builtins': 'off',
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
}
