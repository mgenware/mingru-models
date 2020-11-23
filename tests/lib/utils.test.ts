import * as assert from 'assert';
import { utils } from '../..';

const eq = assert.equal;

it('toSnakeCase', () => {
  eq(utils.toSnakeCase('TableABC'), 'table_abc');
});

it('stripEndingSnakeID', () => {
  eq(utils.stripTrailingSnakeID('user_max_id'), 'user_max');
});
