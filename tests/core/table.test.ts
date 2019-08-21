import * as dd from '../../';
import user from '../models/user';
import employee from '../models/employee';

it('Table name', () => {
  expect(user.__name).toBe('user');
});

it('enumerateColumns', () => {
  const cols: dd.Column[] = [];
  dd.enumerateColumns(user, col => cols.push(col));
  expect(cols).toEqual([
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
  expect(cols).toEqual([
    user.def_value,
    user.follower_count,
    user.id,
    user.name,
    user.snake_case_name,
  ]);
});

it('__pks', () => {
  expect(user.__pks).toEqual([user.id]);
  expect(user.__pkAIs).toEqual([user.id]);
  expect(employee.__pks).toEqual([employee.id]);
  expect(employee.__pkAIs).toEqual([]);
});
