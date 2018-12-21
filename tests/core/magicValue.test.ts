import * as dd from '../../';

test('Magic values', () => {
  expect(dd.now().type).toBe(dd.MagicValueType.now);
});
