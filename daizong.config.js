module.exports = {
  clean: {
    run: {
      del: ['dist', 'dist_tests'],
    },
  },
  lint: {
    run: 'eslint --max-warnings 0 --ext .ts src/ tests/',
  },
  dev: {
    run: ['#clean', 'tsc -b tests -w'],
  },
  t: {
    run: 'mocha --require source-map-support/register dist_tests/**/*.test.js',
  },
  test: {
    run: ['#clean', 'tsc -b tests', '#lint', '#t'],
  },
  build: {
    run: '#test',
  },
};
