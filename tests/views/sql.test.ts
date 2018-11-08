import * as dd from '../..';
import user from '../models/user';

test('SQL 1', () => {
  const sql = dd.sql`${user.id} = 1 OR ${user.name} = ${dd.input(user.name)}`;
  expect(sql.elements).toEqual(['', user.id, ' = 1 OR ', user.name, ' = ', dd.input(user.name), '']);
});

test('SQL 2', () => {
  const sql = dd.sql`START${user.id} = 1 OR ${user.name} = ${dd.input(user.name)}END`;
  expect(sql.elements).toEqual(['START', user.id, ' = 1 OR ', user.name, ' = ', dd.input(user.name), 'END']);
});

test('Check type', () => {
  const SQL = dd.sql`${user.id} = 1`;
  expect(SQL).toBeInstanceOf(dd.SQL);
});
