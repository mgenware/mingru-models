import * as dd from '../..';
import user from '../models/user';

test('Select and from', () => {
  const v = dd.view('t').select(user.id, user.name).from(user);
  expect(v.name).toBe('t');
  expect(v.fromTable).toBe(user);
});
