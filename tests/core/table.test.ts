import * as mm from '../../';
import user from '../models/user';
import employee from '../models/employee';
import * as assert from 'assert';
import like from '../models/like';

const expect = assert.equal;

it('Table name', () => {
  expect(user.__name, 'user');
  expect(user.toString(), 'Table(user)');
});

it('enumerateColumns', () => {
  const cols: mm.Column[] = [];
  mm.enumerateColumns(user, col => cols.push(col));
  assert.deepEqual(cols, [
    user.id,
    user.name,
    user.snake_case_name,
    user.follower_count,
    user.def_value,
  ]);
});

it('enumerateColumns (sorted)', () => {
  const cols: mm.Column[] = [];
  mm.enumerateColumns(user, col => cols.push(col), { sorted: true });
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

it('Composite PKs', () => {
  assert.deepEqual(like.__pks, [like.user_id, like.type]);
  assert.deepEqual(like.__pkAIs, []);
});
