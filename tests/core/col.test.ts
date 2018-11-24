import * as dd from '../../';
import user from '../models/user';
import post from '../models/post';

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

test('__getInputName', () => {
  expect(user.name.__getInputName()).toBe('userName');
  expect(user.id.__getInputName()).toBe('userID');
});
