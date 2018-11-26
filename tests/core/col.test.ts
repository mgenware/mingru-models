import * as dd from '../../';
import user from '../models/user';
import post from '../models/post';
import cmt from '../models/postCmt';

test('Table and name', () => {
  // Normal col
  expect(post.id.__name).toBe('id');
  expect(post.id.__table).toBe(post);
  // FK
  expect(post.user_id.__name).toBe('user_id');
  expect(post.user_id.__table).toBe(post);
  const ref = ((post.user_id as unknown) as dd.ForeignColumn).ref;
  expect(ref.__name).toBe('id');
  expect(ref.__table).toBe(user);
});

test('Col types', () => {
  expect(user.id).toBeInstanceOf(dd.Column);
  expect(user.id.__type).toBe(dd.ColumnBaseType.Full);
  expect(post.user_id).toBeInstanceOf(dd.ForeignColumn);
  expect(post.user_id.__type).toBe(dd.ColumnBaseType.Foreign);
  expect(post.user_id.join(user).name).toBeInstanceOf(dd.JoinedColumn);
  expect(post.user_id.join(user).name.__type).toBe(dd.ColumnBaseType.Joined);
  expect(post.user_id.as('haha')).toBeInstanceOf(dd.SelectedColumn);
  expect(post.user_id.as('haha').__type).toBe(dd.ColumnBaseType.Selected);
});

test('__getTargetColumn', () => {
  expect(user.id.__getTargetColumn()).toBe(user.id);
  expect(post.user_id.__getTargetColumn()).toBe(user.id);
  expect(post.user_id.join(user).name.__getTargetColumn()).toBe(user.name);
  expect(post.id.as('haha').__getTargetColumn()).toBe(post.id);
  expect(post.user_id.join(user).name.as('haha').__getTargetColumn()).toBe(user.name);
});

test('Column.__getInputName', () => {
  expect(user.id.__getInputName()).toBe('userID');
  expect(user.snake_case_name.__getInputName()).toBe('userSnakeCaseName');
  expect(cmt.snake_case_post_id.__getInputName()).toBe('postCmtSnakeCasePostID');
});

test('ForeignColumn.__getInputName', () => {
  expect(post.snake_case_user_id.__getInputName()).toBe('postSnakeCaseUserID');
});

test('JoinedColumn.__getInputName', () => {
  expect(post.snake_case_user_id.join(user).id.__getInputName()).toBe('postSnakeCaseUserID');
  expect(post.snake_case_user_id.join(user).name.__getInputName()).toBe('postSnakeCaseUserName');
  expect(cmt.post_id.join(post).user_id.join(user).id.__getInputName()).toBe('postCmtPostUserID');
  expect(cmt.post_id.join(post).snake_case_user_id.join(user).name.__getInputName()).toBe('postCmtPostSnakeCaseUserName');
});

test('SelectedColumn.__getInputName', () => {
  expect(user.id.as('__a_b').__getInputName()).toBe('__a_b');
  expect(cmt.post_id.join(post).snake_case_user_id.join(user).name.as('haha').__getInputName()).toBe('haha');
});

class JCTable extends dd.Table {
  jc = post.user_id.join(user).name;
}

test('JoinedColumn in table def', () => {
  expect(() => dd.table(JCTable)).toThrow('JoinedColumn');
});

class SCTable extends dd.Table {
  sc = dd.int().as('haha');
}

test('SelectedColumn in table def', () => {
  expect(() => dd.table(SCTable)).toThrow('SelectedColumn');
});
