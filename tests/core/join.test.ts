import * as dd from '../../';
import user from '../models/user';
import post from '../models/post';
import cmt from '../models/cmt';

function testType(col: dd.ColumnBase) {
  expect(col instanceof dd.JoinedColumn).toBe(true);
}

function toJC(col: dd.ColumnBase): dd.JoinedColumn {
  return (col as unknown) as dd.JoinedColumn;
}

test('Instance type', () => {
  testType(post.user_id.join(user).name);
  testType(cmt.post_id.join(post).user_id.join(user).name);
});

// jc.localColumn is not tested cuz it may be another JC if join is nested (see 'Nested JoinedColumn' below)
function testJCCols(jc: dd.JoinedColumn, rc: dd.ColumnBase, sc: dd.ColumnBase, path: string) {
  expect(jc.remoteColumn).toBe(rc);
  expect(jc.selectedColumn).toBe(sc);
  expect(jc.joinPath).toBe(path);
}

test('JoinedColumn', () => {
  const jc = toJC(post.user_id.join(user).name);
  expect(jc.localColumn).toBe(post.user_id);
  testJCCols(jc, user.id, user.name, '[[post.user_id].[user.id]]');
});

test('Nested JoinedColumn', () => {
  const jc1 = toJC(cmt.post_id.join(post).user_id);
  const jc2 = toJC(jc1.join(user).name);
  expect(jc2.localColumn).toBe(jc1);
  testJCCols(jc2, user.id, user.name, '[[[[cmt.post_id].[post.id]].user_id].[user.id]]');

  expect(jc1.localColumn).toBe(cmt.post_id);
  testJCCols(jc1, post.id, post.user_id, '[[cmt.post_id].[post.id]]');

  const jc3 = toJC(cmt.post_id.join(post).user_id.join(user).id);
  testJCCols(jc3, user.id, user.id, '[[[[cmt.post_id].[post.id]].user_id].[user.id]]');

});
