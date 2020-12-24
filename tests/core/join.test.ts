import * as mm from '../..';
import user from '../models/user';
import post from '../models/post';
import postCmt from '../models/postCmt';
import postCmtAss from '../models/postCmtAss';
import cmt from '../models/cmt';
import { eq, deepEq } from '../assert-aliases';

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
  eq(jc.__getData().table instanceof mm.JoinedTable, true);
  eq(jc.__getData().mirroredColumn, selectedColumn);
  const jt = jc.__getData().table as mm.JoinedTable;
  eq(jt.tableInputName(), tableInputName);
  eq(jt.destTable, destTable);
  eq(jt.destColumn, destColumn);
  eq(jt.srcColumn, srcColumn);
  eq(jt.keyPath, path);
  eq(jc.__getSourceTable(), sourceTable);
  eq(jc.__getInputName(), inputName);
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
    '(J|0|post|user)[user_id|id]',
    post,
    'user_name',
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
    '(J|0|post|user)[user_id|id]',
    post,
    'user_name',
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
    '(J|0|post|user)[title|name]',
    post,
    'title_follower_count',
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
    '(J|0|post|user)[title|name][user_id|id][snake_case_user_id|id]',
    post,
    'title_follower_count',
  );
  deepEq((jc.__getData().table as mm.JoinedTable).extraColumns, [
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
    '(J|0|post_cmt|post)[post_id|id]',
    postCmt,
    'post_user_id',
  );

  testJCCols(
    jc2,
    'post_user',
    user,
    user.id,
    user.name,
    jc1,
    '(J|0|(J|0|post_cmt|post)[post_id|id]|user)[user_id|id]',
    postCmt,
    'post_user_name',
  );

  // like jc2, but select user.id instead of user.name
  const jc3 = postCmt.post_id.join(post).user_id;
  const jc4 = jc3.join(user).id;
  testJCCols(
    jc4,
    'post_user',
    user,
    user.id,
    user.id,
    jc3,
    '(J|0|(J|0|post_cmt|post)[post_id|id]|user)[user_id|id]',
    postCmt,
    'post_user_id',
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
    '(J|0|post|post_cmt)[user_id|id]',
    post,
    'user_post_id',
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
    '(J|0|post|post_cmt)[user_id|post_id]',
    post,
    'user_snake_case_post_id',
  );
});

it('Associative join', () => {
  const jc = postCmtAss.cmt_id.associativeJoin(cmt).user_id;
  eq((jc.__getData().table as mm.JoinedTable).associative, true);
  testJCCols(
    jc,
    'cmt',
    cmt,
    cmt.id,
    cmt.user_id,
    postCmtAss.cmt_id,
    '(J|0|post_cmt_ass|post_cmt)[cmt_id|id]',
    postCmtAss,
    'user_id',
  );

  const jc2 = jc.join(user).name;
  testJCCols(
    jc2,
    'user',
    user,
    user.id,
    user.name,
    jc,
    '(J|0|(J|0|post_cmt_ass|post_cmt)[cmt_id|id]|user)[user_id|id]',
    postCmtAss,
    'user_name',
  );
});

function getJoinType(jc: mm.Column): mm.JoinType {
  return (jc.__getData().table as mm.JoinedTable).joinType;
}

it('Join types', () => {
  eq(getJoinType(post.title.join(user, user.name).id), mm.JoinType.inner);
  eq(getJoinType(post.title.leftJoin(user, user.name).id), mm.JoinType.left);
  eq(getJoinType(post.title.rightJoin(user, user.name).id), mm.JoinType.right);
  eq(getJoinType(post.title.fullJoin(user, user.name).id), mm.JoinType.full);
});
