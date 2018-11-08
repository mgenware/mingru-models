import * as dd from '../..';
import user from '../models/user';

const SQL = dd.sql`${user.id} = 1 OR ${user.name} = ${dd.input(user.name)}`;

test('Raw SQL', () => {
  const equals = SQL.equalsTo(
    ['', ' = 1 OR ', ' = ', ''],
    [user.id, user.name, dd.input(user.name)],
  );
  expect(equals).toBe(true);
});

test('Check type', () => {
  expect(SQL).toBeInstanceOf(dd.SQL);
});
