import { utils } from '../../';

test('toSnakeCase', () => {
  expect(utils.toSnakeCase('TableABC')).toBe('table_abc');
});

test('toCamelCase', () => {
  expect(utils.toCamelCase('id')).toBe('id');
  expect(utils.toCamelCase('user_max_id')).toBe('userMaxID');
});

test('stripEndingSnakeID', () => {
  expect(utils.stripTrailingSnakeID('user_max_id')).toBe('user_max');
});

test('capitalizeColumnName', () => {
  expect(utils.capitalizeColumnName('userId')).toBe('UserID');
  expect(utils.capitalizeColumnName('Id')).toBe('ID');
  expect(utils.capitalizeColumnName('id')).toBe('ID');
});
