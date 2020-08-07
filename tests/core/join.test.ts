import * as assert from 'assert';
import * as mm from '../..';
import user from '../models/user';
import post from '../models/post';
import postCmt from '../models/postCmt';
import postCmtAss from '../models/postCmtAss';
import cmt from '../models/cmt';

const eq = assert.equal;

function testJCCols(
  jc: mm.Column,
  tableInputName: string,
  destTable: mm.Table,
  destColumn: mm.Column,
  selectedColumn: mm.Column,
  srcColumn: mm.Column,
  path: string,
  sourceTable: mm.Table,
  inputName: string,
) {
  eq(jc.__table instanceof mm.JoinedTable, true);
  eq(jc.__mirroredColumn, selectedColumn);
  const jt = jc.__table as mm.JoinedTable;
  eq(jt.tableInputName(), tableInputName);
  eq(jt.destTable, destTable);
  eq(jt.destColumn, destColumn);
  eq(jt.srcColumn, srcColumn);
  eq(jt.keyPath, path);
  eq(jc.getSourceTable(), sourceTable);
  eq(jc.inputName(), inputName);
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
    post,
    'userName',
  );
});

it('Explicit join', () => {
  const jc = post.user_id.join(user, user.id).name;
  testJCCols(
    jc,
    'user',
    user,
    user.id,
    user.name,
    post.user_id,
    '[[post.user_id].[user.id]]',
    post,
    'userName',
  );
});

it('Explicit join without FK', () => {
  const jc = post.title.join(user, user.name).follower_count;
  testJCCols(
    jc,
    'title',
    user,
    user.name,
    user.follower_count,
    post.title,
    '[[post.title].[user.name]]',
    post,
    'titleFollowerCount',
  );
});

it('Join with multiple keys', () => {
  const jc = post.title.join(user, user.name, [
    [post.user_id, user.id],
    [post.snake_case_user_id, user.id],
  ]).follower_count;
  testJCCols(
    jc,
    'title',
    user,
    user.name,
    user.follower_count,
    post.title,
    '[[post.title].[user.name]]',
    post,
    'titleFollowerCount',
  );
  assert.deepEqual((jc.__table as mm.JoinedTable).extraColumns, [
    [post.user_id, user.id],
    [post.snake_case_user_id, user.id],
  ]);
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
    postCmt,
    'postUserID',
  );

  testJCCols(
    jc2,
    'postUser',
    user,
    user.id,
    user.name,
    jc1,
    '[[[[post_cmt.post_id].[post.id]].user_id].[user.id]]',
    postCmt,
    'postUserName',
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
    postCmt,
    'postUserID',
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
    post,
    'userPostID',
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
    post,
    'userSnakeCasePostID',
  );
});

it('Associative join', () => {
  const jc = postCmtAss.cmt_id.associativeJoin(cmt).user_id;
  eq((jc.__table as mm.JoinedTable).associative, true);
  testJCCols(
    jc,
    'cmt',
    cmt,
    cmt.id,
    cmt.user_id,
    postCmtAss.cmt_id,
    '[[post_cmt_ass.cmt_id].[post_cmt.id]]',
    postCmtAss,
    'userID',
  );

  const jc2 = jc.join(user).name;
  testJCCols(
    jc2,
    'user',
    user,
    user.id,
    user.name,
    jc,
    '[[[[post_cmt_ass.cmt_id].[post_cmt.id]].user_id].[user.id]]',
    postCmtAss,
    'userName',
  );
});
