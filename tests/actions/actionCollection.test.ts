import * as dd from '../../';
import user from '../models/user';
import postCmt from '../models/postCmt';

test('ActionCollection', () => {
  const actions = dd.actions(user);
  const v1 = actions
    .update('t')
    .set(user.name, dd.sql`${dd.input(user.name)}`)
    .set(user.follower_count, dd.sql`${user.follower_count} + 1`);

  expect(actions).toBeInstanceOf(dd.TableActionCollection);
  expect(actions.map.size).toBe(1);
  expect(actions.map.get('UpdateUserT')).toBe(v1);
  expect(v1.name).toBe('UpdateUserT');

  const v2 = actions.select('t', user.id);
  expect(actions.map.size).toBe(2);
  expect(actions.map.get('SelectUserT')).toBe(v2);
  expect(v2.name).toBe('SelectUserT');
});

test('Exception on duplicate names', () => {
  const actions = dd.actions(user);
  actions.select('t', user.id);
  actions.select('t2', user.id);
  expect(() => actions.select('t', user.id)).toThrowError();
});

test('Pascal case on action name', () => {
  const actions = dd.actions(postCmt);
  const v = actions.select('t', postCmt.id);
  expect(v.name).toBe('SelectPostCmtT');
});
