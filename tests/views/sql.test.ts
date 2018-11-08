import * as dd from '../..';
import user from '../models/user';

test('SQL 1', () => {
  const SQL = dd.sql`${user.id} = 1 OR ${user.name} = ${dd.input(user.name)}`;
  const equals = SQL.equalsTo(
    ['', ' = 1 OR ', ' = ', ''],
    [user.id, user.name, dd.input(user.name)],
  );
  expect(equals).toBe(true);
});

test('SQL 2', () => {
  const SQL = dd.sql`START${user.id} = 1 OR ${user.name} = ${dd.input(user.name)}END`;
  const equals = SQL.equalsTo(
    ['START', ' = 1 OR ', ' = ', 'END'],
    [user.id, user.name, dd.input(user.name)],
  );
  expect(equals).toBe(true);
});

test('Check type', () => {
  const SQL = dd.sql`${user.id} = 1`;
  expect(SQL).toBeInstanceOf(dd.SQL);
});
