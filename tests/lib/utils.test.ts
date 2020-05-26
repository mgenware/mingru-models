import * as assert from 'assert';
import { utils } from '../..';

const expect = assert.equal;

it('toSnakeCase', () => {
  expect(utils.toSnakeCase('TableABC'), 'table_abc');
});

it('toCamelCase', () => {
  expect(utils.toCamelCase('id'), 'id');
  expect(utils.toCamelCase('user_max_id'), 'userMaxID');
});

it('stripEndingSnakeID', () => {
  expect(utils.stripTrailingSnakeID('user_max_id'), 'user_max');
});

it('capitalizeColumnName', () => {
  expect(utils.capitalizeColumnName('userId'), 'UserID');
  expect(utils.capitalizeColumnName('Id'), 'ID');
  expect(utils.capitalizeColumnName('id'), 'ID');
});
