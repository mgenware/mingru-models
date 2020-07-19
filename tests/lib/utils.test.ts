import * as assert from 'assert';
import { utils } from '../..';

const eq = assert.equal;

it('toSnakeCase', () => {
  eq(utils.toSnakeCase('TableABC'), 'table_abc');
});

it('toCamelCase', () => {
  eq(utils.toCamelCase('id'), 'id');
  eq(utils.toCamelCase('user_max_id'), 'userMaxID');
});

it('stripEndingSnakeID', () => {
  eq(utils.stripTrailingSnakeID('user_max_id'), 'user_max');
});

it('capitalizeColumnName', () => {
  eq(utils.capitalizeColumnName('userId'), 'UserID');
  eq(utils.capitalizeColumnName('Id'), 'ID');
  eq(utils.capitalizeColumnName('id'), 'ID');
});
