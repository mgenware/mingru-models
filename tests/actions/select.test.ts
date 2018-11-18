import * as dd from '../../';
import user from '../models/user';

test('Select and from', () => {
  const actions = dd.actions(user);
  const v = actions.select('t', user.id, user.name)
    .from(user)
    .where(dd.sql`${user.id} = 1`);

  expect(v.name).toBe('SelectT');
  expect(v).toBeInstanceOf(dd.SelectAction);
  expect(v.columns.length).toBe(2);
  expect(v.columns[0]).toBe(user.id);
  expect(v.columns[1]).toBe(user.name);
  expect(v.table).toBe(user);
  expect(v.whereSQL).not.toBeNull();
});
