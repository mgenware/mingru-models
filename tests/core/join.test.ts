import * as dd from '../../';
import user from '../models/user';
import post from '../models/post';
import postCmt from '../models/postCmt';
import { Column } from '../../dist/main';

function testType(col: dd.Column, name: string) {
  expect(col.isJoinedColumn()).toBe(true);
  expect(col.name).toBe(name);
}

test('Instance type', () => {
  testType(post.user_id.join(user).name, 'name');
  testType(postCmt.post_id.join(post).user_id.join(user).name, 'name');
});

function testJCCols(
  jc: dd.Column,
  destTable: dd.Table,
  destColumn: dd.Column,
  selectedColumn: dd.Column,
  srcColumn: Column,
  path: string,
) {
  expect(jc.mirroredColumn).toBe(selectedColumn);
  const jt = jc.table as dd.JoinedTable;
  expect(jt.destTable).toBe(destTable);
  expect(jt.destColumn).toBe(destColumn);
  expect(jt.srcColumn).toBe(srcColumn);
  expect(jt.keyPath).toBe(path);
}

test('JoinedColumn', () => {
  const jc = post.user_id.join(user).name;
  testJCCols(
    jc,
    user,
    user.id,
    user.name,
    post.user_id,
    '[[post.user_id].[user.id]]',
  );
});

test('Nested JoinedColumn', () => {
  const jc1 = postCmt.post_id.join(post).user_id;
  const jc2 = jc1.join(user).name;

  testJCCols(
    jc1,
    post,
    post.id,
    post.user_id,
    postCmt.post_id,
    '[[post_cmt.post_id].[post.id]]',
  );

  testJCCols(
    jc2,
    user,
    user.id,
    user.name,
    jc1,
    '[[[[post_cmt.post_id].[post.id]].user_id].[user.id]]',
  );

  // like jc2, but select user.id instead of user.name
  const jc3 = postCmt.post_id.join(post).user_id;
  const jc4 = jc3.join(user).id;
  testJCCols(
    jc4,
    user,
    user.id,
    user.id,
    jc3,
    '[[[[post_cmt.post_id].[post.id]].user_id].[user.id]]',
  );
});
