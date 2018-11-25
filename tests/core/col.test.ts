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
  expect(user.id instanceof dd.Column).toBe(true);
  expect(post.user_id instanceof dd.ForeignColumn).toBe(true);
});

test('__getTargetColumn', () => {
  expect(user.id.__getTargetColumn()).toBe(user.id);
  expect(post.user_id.__getTargetColumn()).toBe(user.id);
  expect(post.user_id.join(user).name.__getTargetColumn()).toBe(user.name);
});

test('Column.__getInputName', () => {
  expect(user.id.__getInputName()).toBe('userID');
  expect(user.snake_case_name.__getInputName()).toBe('userSnakeCaseName');
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
