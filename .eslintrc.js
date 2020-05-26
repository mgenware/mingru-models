module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['airbnb-typescript/base', 'plugin:@typescript-eslint/recommended'],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  rules: {
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'no-plusplus': 'off',
    // Allow `for-of` loops.
    'no-restricted-syntax': [
      'error',
      'ForInStatement',
      'LabeledStatement',
      'WithStatement',
    ],
    // We'll let prettier handle operator linebreaks.
    'operator-linebreak': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
    'lines-between-class-members': [
      'error',
      'always',
      { exceptAfterSingleLine: true },
    ],
    'no-underscore-dangle': 'off',
    'max-classes-per-file': 'off',
    'import/prefer-default-export': 'off',
    'no-continue': 'off',
    'object-curly-newline': [
      'error',
      { ImportDeclaration: 'never', ExportDeclaration: 'never' },
    ],
    'func-names': 'off',
  },
};
