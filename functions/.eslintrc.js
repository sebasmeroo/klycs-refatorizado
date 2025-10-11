module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['tsconfig.json', 'tsconfig.dev.json'],
    sourceType: 'module',
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  ignorePatterns: ['lib', 'generated'],
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    'import/no-duplicates': 'off',
    'max-len': 'off',
    'quotes': 'off',
    'comma-dangle': 'off',
    'object-curly-spacing': 'off',
    'no-trailing-spaces': 'off',
    'prefer-const': 'off',
    'no-var': 'off',
    'object-shorthand': 'off',
    'quote-props': 'off',
    'no-useless-escape': 'off',
  },
};
