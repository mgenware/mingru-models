import * as dd from '../../';
import user from '../models/user';

test('Update', () => {
  const actions = dd.actions(user);
  const v = actions
    .update('t')
    .set(user.name, dd.sql`${dd.input(user.name)}`)
    .set(user.follower_count, dd.sql`${user.follower_count} + 1`)
    .where(dd.sql`${user.id} = 1`);

  expect(v.name).toBe('UpdateT');
  expect(v).toBeInstanceOf(dd.UpdateAction);
  expect(v).toBeInstanceOf(dd.Action);
  expect(v.table).toBe(user);
  expect(v.whereSQL).not.toBeNull();
  expect(v.setters.length).toBe(2);
  expect(v.setters[0].column).toBe(user.name);
  expect(v.setters[0].sql).not.toBeNull();
  expect(v.setters[1].column).toBe(user.follower_count);
  expect(v.setters[1].sql).not.toBeNull();
  expect(v.type).toBe(dd.ActionType.update);
});

test('Update without where', () => {
  const actions = dd.actions(user);
  const v = actions
    .update('t')
    .set(user.name, dd.sql`${dd.input(user.name)}`)
    .set(user.follower_count, dd.sql`${user.follower_count} + 1`);

  expect(v.name).toBe('UpdateT');
  expect(v.table).toBe(user);
  expect(v.setters.length).toBe(2);
  expect(v.setters[0].column).toBe(user.name);
  expect(v.setters[0].sql).not.toBeNull();
  expect(v.setters[1].column).toBe(user.follower_count);
  expect(v.setters[1].sql).not.toBeNull();
});
