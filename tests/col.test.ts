import * as dd from '..';
import user from './models/user';
import post from './models/post';

test('Col name', () => {
  expect(user.id instanceof dd.Column).toBe(true);
  expect(post.user_id instanceof dd.ForeignColumn).toBe(true);
});
