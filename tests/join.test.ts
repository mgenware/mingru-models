import * as dd from '..';
import user from './models/user';
import post from './models/post';

test('Joined key', () => {
  expect(post instanceof dd.Table).toBe(true);
  const userName = post.user_id.join(user).name;
  expect(userName instanceof dd.JoinedColumn).toBe(true);
});
