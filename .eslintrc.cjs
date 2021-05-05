module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['plugin:@typescript-eslint/recommended', 'mgenware'],
  parserOptions: {
    sourceType: 'module',
    project: './tsconfig.json',
  },
  rules: {
    'no-underscore-dangle': 'off',
    'no-return-assign': 'off',
    'func-names': 'off',
  },
};
