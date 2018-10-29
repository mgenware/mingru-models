import * as dd from '..';
import user from './models/user';
import post from './models/post';
import cmt from './models/cmt';

function testType(col: dd.ColumnBase) {
  expect(col instanceof dd.JoinedColumn).toBe(true);
}

test('Instance type', () => {
  testType(post.user_id.join(user).name);
  testType(cmt.post_id.join(post).user_id.join(user).name);
});

function testJC(col: dd.ColumnBase, lc: dd.ColumnBase, rc: dd.ColumnBase, tc: dd.ColumnBase) {
  const jc = col as dd.JoinedColumn;
  expect(jc.localColumn).toBe(lc);
  expect(jc.remoteColumn).toBe(rc);
  expect(jc.targetColumn).toBe(tc);
}

test('JoinedColumn', () => {
  testJC(post.user_id.join(user).name, post.user_id, user.id, user.name);
});
