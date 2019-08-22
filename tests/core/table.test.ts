import * as dd from '../../';
import user from '../models/user';
import employee from '../models/employee';
import * as assert from 'assert';

const expect = assert.equal;

it('Table name', () => {
  expect(user.__name, 'user');
});

it('enumerateColumns', () => {
  const cols: dd.Column[] = [];
  dd.enumerateColumns(user, col => cols.push(col));
  assert.deepEqual(cols, [
    user.id,
    user.name,
    user.snake_case_name,
    user.follower_count,
    user.def_value,
  ]);
});

it('enumerateColumns (sorted)', () => {
  const cols: dd.Column[] = [];
  dd.enumerateColumns(user, col => cols.push(col), { sorted: true });
  assert.deepEqual(cols, [
    user.def_value,
    user.follower_count,
    user.id,
    user.name,
    user.snake_case_name,
  ]);
});

it('__pks', () => {
  assert.deepEqual(user.__pks, [user.id]);
  assert.deepEqual(user.__pkAIs, [user.id]);
  assert.deepEqual(employee.__pks, [employee.id]);
  assert.deepEqual(employee.__pkAIs, []);
});
