import * as dd from '../..';
import user from '../models/user';

test('Raw SQL', () => {
  const sql = dd.sql`${user.id} = 1 OR ${user.name} = ${dd.input(user.name)}`;
  const equals = sql.equalsTo(
    ['', ' = 1 OR ', ' = ', ''],
    [user.id, user.name, dd.input(user.name)],
  );
  expect(equals).toBe(true);
});
