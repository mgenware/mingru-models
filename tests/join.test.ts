import * as dd from '..';
import user from './models/user';
import post from './models/post';
import cmt from './models/cmt';
import { JoinedColumn } from '../dist/main';

test('Multiple joins', () => {
  expect(post.user_id.join(user).name instanceof dd.JoinedColumn).toBe(true);
  expect(cmt.post_id.join(post).user_id.join(user).name instanceof dd.JoinedColumn).toBe(true);
});

test('JoinedTable', () => {
  // tslint:disable-next-line no-any
  const table = post.user_id.join(user) as any;
  expect(table.__destTable).toBe(user);
  expect(table.__srcColumn).toBe(post.user_id);
});

test('JoinedColumn', () => {
  const col = (post.user_id.join(user).id as unknown) as JoinedColumn;
  expect(col instanceof dd.JoinedColumn).toBe(true);
  // Note that JoinedColumn.__table and __name point to remote table
  expect(col.__table).toBe(user);
  expect(col.__name).toBe('id');

  expect(col.localCol).toBe(post.user_id);
  expect(col.remoteCol).toBe(user.id);
});
