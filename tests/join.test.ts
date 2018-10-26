import * as dd from '..';
import user from './models/user';
import post from './models/post';
import cmt from './models/cmt';

test('Multiple joins', () => {
  expect(post.user_id.join(user).name instanceof dd.JoinedColumn).toBe(true);
  expect(cmt.post_id.join(post).user_id.join(user).name instanceof dd.JoinedColumn).toBe(true);
});

test('Extended props', () => {
  // tslint:disable-next-line no-any
  const joined = post.user_id.join(user) as any;
  expect(joined.__destTable).toBe(user);
  expect(joined.__srcColumn).toBe(post.user_id);
});
