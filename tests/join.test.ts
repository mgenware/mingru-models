import * as dd from '..';
import user from './models/user';
import post from './models/post';
import cmt from './models/cmt';

test('Multiple joins', () => {
  expect(post.user_id.join(user).name instanceof dd.JoinedColumn).toBe(true);
  expect(cmt.post_id.join(post).user_id.join(user).name instanceof dd.JoinedColumn).toBe(true);
});
