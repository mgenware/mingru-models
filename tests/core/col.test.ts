import * as dd from '../../';
import user from '../models/user';
import post from '../models/post';
import { Column } from '../../';
import cmt from '../models/postCmt';

test('Frozen after dd.table', () => {
  expect(Object.isFrozen(post.id)).toBe(true);
  expect(Object.isFrozen(post.user_id)).toBe(true);
  expect(Object.isFrozen(post.title)).toBe(true);
});

test('Normal col', () => {
  expect(post.id.__name).toBe('id');
  expect(post.id.__table).toBe(post);
});

test('Implicit FK', () => {
  const col = post.user_id;
  expect(col.__table).toBe(post);
  expect(col.__name).toBe('user_id');
  expect(col.foreignColumn).toBe(user.id);
  expect(col.type).not.toBe(user.id.type);
});

test('Explicit FK', () => {
  const col = post.e_user_id_n;
  expect(col.__table).toBe(post);
  expect(col.__name).toBe('e_user_id_n');
  expect(col.foreignColumn).toBe(user.id);
  expect(col).not.toBe(user.id.type);
  expect(col.type.nullable).toBe(true);
});

test('Explicit FK (untouched)', () => {
  const col = post.e_user_id;
  expect(col.__table).toBe(post);
  expect(col.__name).toBe('e_user_id');
  expect(col.foreignColumn).toBe(user.id);
  expect(col.type).not.toBe(user.id.type);
  expect(col.type.nullable).toBe(false);
});

test('freeze', () => {
  const col = dd.int(234);
  col.freeze();
  expect(Object.isFrozen(col)).toBe(true);
  expect(Object.isFrozen(col.type)).toBe(true);
});

test('Column.newForeignColumn', () => {
  const a = user.id;
  const b = Column.newForeignColumn(a, post);
  // FK
  expect(b.foreignColumn).toBe(a);
  // name is cleared
  expect(b.__name).toBeNull();
  // Value being reset
  expect(b.type.pk).toBe(false);
  expect(b.__table).toBe(post);
  // props is copied
  expect(b.type).not.toBe(a.type);
  // props.types is copied
  expect(b.type.types).not.toBe(a.type.types);

  // Check equality
  expect(a.default).toBe(b.default);
  expect(a.type.types).toEqual(b.type.types);
  expect(a.type.nullable).toBe(b.type.nullable);
  expect(a.type.unique).toBe(b.type.unique);
});

test('Column.newJoinedColumn', () => {
  const t = (post.user_id.join(user) as unknown) as dd.JoinedTable;
  const a = user.name;
  const b = Column.newJoinedColumn(a, t);
  // mirroredColumn
  expect(b.mirroredColumn).toBe(a);
  // Value being reset
  expect(b.type.pk).toBe(false);
  expect(b.__name).toBe(a.__name);
  expect(b.__table).toBe(t);
  // props is copied
  expect(b.type).not.toBe(a.type);
  // props.types is copied
  expect(b.type.types).not.toBe(a.type.types);

  // Check equality
  expect(a.default).toBe(b.default);
  expect(a.type.types).toEqual(b.type.types);
  expect(a.type.nullable).toBe(b.type.nullable);
  expect(a.type.unique).toBe(b.type.unique);
});

test('Mutate a frozen column', () => {
  const a = dd.int(234);
  a.freeze();
  expect(() => a.nullable).toThrow();
});

test('notNull (default)', () => {
  const c = dd.int(123);
  expect(c.type.nullable).toBe(false);
});

test('nullable', () => {
  const c = dd.int(123).nullable;
  expect(c.type.nullable).toBe(true);
});

test('unique', () => {
  const c = dd.int(123).unique;
  expect(c.type.unique).toBe(true);
});

test('unique (default)', () => {
  const c = dd.int(123);
  expect(c.type.unique).toBe(false);
});

test('setDefault', () => {
  let c = dd.int(123).setDefault('omg');
  expect(c.default).toBe('omg');

  c = dd.int(123).setDefault(null);
  expect(c.default).toBe(null);
});

test('Column.inputName', () => {
  expect(user.id.inputName()).toBe('id');
  expect(user.snake_case_name.inputName()).toBe('snakeCaseName');
  expect(cmt.snake_case_post_id.inputName()).toBe('snakeCasePostID');
});

test('ForeignColumn.inputName', () => {
  expect(post.snake_case_user_id.inputName()).toBe('snakeCaseUserID');
});

test('JoinedColumn.inputName', () => {
  expect(post.snake_case_user_id.join(user).id.inputName()).toBe(
    'snakeCaseUserID',
  );
  expect(post.snake_case_user_id.join(user).name.inputName()).toBe(
    'snakeCaseUserName',
  );
  expect(
    cmt.post_id
      .join(post)
      .user_id.join(user)
      .id.inputName(),
  ).toBe('postUserID');
  expect(
    cmt.post_id
      .join(post)
      .snake_case_user_id.join(user)
      .name.inputName(),
  ).toBe('postSnakeCaseUserName');
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

test('RawColumn in table def', () => {
  expect(() => dd.table(SCTable)).toThrow('RawColumn');
});

test('Register property callback', () => {
  let counter = 0;
  const cb = () => counter++;
  const col = new dd.Column(new dd.ColumnType('abc'));
  // Register the callback twice
  dd.CoreProperty.registerHandler(col, cb);
  dd.CoreProperty.registerHandler(col, cb);
  class User extends dd.Table {
    t = col;
  }

  expect(col.__handlers.length).toBe(2);
  expect(counter).toBe(0);
  dd.table(User);
  expect(col.__handlers.length).toBe(0);
  expect(counter).toBe(2);
});
