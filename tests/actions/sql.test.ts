import * as dd from '../../';
import user from '../models/user';

test('SQL', () => {
  const sql = dd.sql`${user.id} = 1 OR ${user.name} = ${dd.input(user.name)}`;
  expect(sql.elements).toEqual(['', user.id, ' = 1 OR ', user.name, ' = ', dd.input(user.name), '']);
  expect(sql).toBeInstanceOf(dd.SQL);
});

test('SQL with input', () => {
  const sql = dd.sql`START${user.id} = 1 OR ${user.name} = ${dd.input(user.name)}END`;
  expect(sql.elements).toEqual(['START', user.id, ' = 1 OR ', user.name, ' = ', dd.input(user.name), 'END']);
});

test('Input', () => {
  const input = dd.input(user.name);
  expect(input.types).toBe(user.name.types);
});

test('Named input', () => {
  const input = dd.input(user.name, 'haha');
  expect(input.types).toBe(user.name.types);
  expect(input.name).toBe('haha');
});
