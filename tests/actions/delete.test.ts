import * as dd from '../../';
import user from '../models/user';

test('Delete', () => {
  const actions = dd.actions(user);
  const v = actions.delete('t')
    .where(dd.sql`${user.id} = 1`);

  expect(v.name).toBe('DeleteT');
  expect(v.table).toBe(user);
  expect(v.whereSQL).not.toBeNull();
});

test('Delete without where', () => {
  const actions = dd.actions(user);
  const v = actions.delete('t')
    .set(user.name, dd.sql`${dd.input(user.name)}`)
    .set(user.follower_count, dd.sql`${user.follower_count} + 1`);

  expect(v.name).toBe('UpdateT');
  expect(v.table).toBe(user);
});
