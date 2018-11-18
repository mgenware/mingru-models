import * as dd from '../../';
import user from '../models/user';

test('ActionCollection', () => {
  const actions = dd.actions(user);
  const v1 = actions.insert('t')
    .set(user.name, dd.sql`${dd.input(user.name)}`)
    .set(user.follower_count, dd.sql`${user.follower_count} + 1`);

  expect(actions).toBeInstanceOf(dd.TableActionCollection);
  expect(actions.map.size).toBe(1);
  expect(actions.map.get('InsertT')).toBe(v1);

  const v2 = actions.select('t', user.id);
  expect(actions.map.size).toBe(2);
  expect(actions.map.get('SelectT')).toBe(v2);
});

test('Exception on duplicate names', () => {
  const actions = dd.actions(user);
  actions.select('t', user.id);
  actions.select('t2', user.id);
  expect(() => actions.select('t', user.id)).toThrowError();
});
