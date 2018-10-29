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

// jc.localColumn is not tested cuz it may be another JC if join is nested (see 'Nested JoinedColumn' below)
function testJCCols(jc: dd.JoinedColumn, rc: dd.ColumnBase, tc: dd.ColumnBase) {
  expect(jc.remoteColumn).toBe(rc);
  expect(jc.targetColumn).toBe(tc);
}

test('JoinedColumn', () => {
  const jc = (post.user_id.join(user).name as unknown) as dd.JoinedColumn;
  expect(jc.localColumn).toBe(post.user_id);
  testJCCols(jc, user.id, user.name);
});

test('Nested JoinedColumn', () => {
  const jc1 = (cmt.post_id.join(post).user_id as unknown) as dd.JoinedColumn;
  const jc2 = (jc1.join(user).name as unknown) as dd.JoinedColumn;
  expect(jc2.localColumn).toBe(jc1);
  testJCCols(jc2, user.id, user.name);

  expect(jc1.localColumn).toBe(cmt.post_id);
  testJCCols(jc1, post.id, post.user_id);
});
