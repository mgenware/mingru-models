import * as dd from '../../';
import user from '../models/user';
import post from '../models/post';
import postCmt from '../models/postCmt';
import { Column } from '../../dist/main';

function testJCCols(
  jc: dd.Column,
  tableInputName: string,
  destTable: dd.Table,
  destColumn: dd.Column,
  selectedColumn: dd.Column,
  srcColumn: Column,
  path: string,
) {
  expect(jc.isJoinedColumn()).toBe(true);
  expect(jc.mirroredColumn).toBe(selectedColumn);
  const jt = jc.__table as dd.JoinedTable;
  expect(jt.tableInputName()).toBe(tableInputName);
  expect(jt.destTable).toBe(destTable);
  expect(jt.destColumn).toBe(destColumn);
  expect(jt.srcColumn).toBe(srcColumn);
  expect(jt.keyPath).toBe(path);
}

it('JoinedColumn', () => {
  const jc = post.user_id.join(user).name;
  testJCCols(
    jc,
    'user',
    user,
    user.id,
    user.name,
    post.user_id,
    '[[post.user_id].[user.id]]',
  );
});

it('Nested JoinedColumn', () => {
  const jc1 = postCmt.post_id.join(post).user_id;
  const jc2 = jc1.join(user).name;

  testJCCols(
    jc1,
    'post',
    post,
    post.id,
    post.user_id,
    postCmt.post_id,
    '[[post_cmt.post_id].[post.id]]',
  );

  testJCCols(
    jc2,
    'postUser',
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
    'postUser',
    user,
    user.id,
    user.id,
    jc3,
    '[[[[post_cmt.post_id].[post.id]].user_id].[user.id]]',
  );
});

it('Join arbitrary table and column', () => {
  // Join pk of postCmt
  let jc = post.user_id.join(postCmt).post_id;
  testJCCols(
    jc,
    'user',
    postCmt,
    postCmt.id,
    postCmt.post_id,
    post.user_id,
    '[[post.user_id].[post_cmt.id]]',
  );

  // Join explicit column of postCmt
  jc = post.user_id.join(postCmt, postCmt.post_id).snake_case_post_id;
  testJCCols(
    jc,
    'user',
    postCmt,
    postCmt.post_id,
    postCmt.snake_case_post_id,
    post.user_id,
    '[[post.user_id].[post_cmt.post_id]]',
  );
});
