import * as dd from '../../';
import user from '../models/user';

test('Table name', () => {
  expect(user.__name).toBe('user');
});

test('Table.forEach', () => {
  const cols: dd.ColumnBase[] = [];
  dd.Table.forEach(user, col => cols.push(col));
  expect(cols).toEqual([
    user.id,
    user.name,
    user.snake_case_name,
    user.follower_count,
  ]);
});
