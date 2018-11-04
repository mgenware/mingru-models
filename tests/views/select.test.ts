import * as dd from '../..';
import user from '../models/user';

test('Select and from', () => {
  const v = dd.action('t').select(user.id, user.name).from(user);
  expect(v.name).toBe('t');
  expect(v.fromTable).toBe(user);
});

test('Where', () => {
  const v = dd.action('t')
    .select(user.id, user.name)
    .from(user)
    .where`${user.id} = 1 OR ${user.name} = ${dd.param(user.name)}`;
  expect(v.whereLiterals).toEqual(['', ' = 1 OR ', ' = ', '']);
  expect(v.whereColumns).toEqual([user.id, user.name, dd.param(user.name)]);
});
