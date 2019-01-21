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
  expect(post.id.props.name).toBe('id');
  expect(post.id.props.table).toBe(post);
});

test('Implicit FK', () => {
  const { props } = post.user_id;
  expect(props.table).toBe(post);
  expect(props.name).toBe('user_id');
  expect(props.foreignColumn).toBe(user.id);
  expect(props).not.toBe(user.id.props);
});

test('Explicit FK', () => {
  const { props } = post.e_user_id_n;
  expect(props.table).toBe(post);
  expect(props.name).toBe('e_user_id_n');
  expect(props.foreignColumn).toBe(user.id);
  expect(props).not.toBe(user.id.props);
  expect(props.nullable).toBe(true);
});

test('Explicit FK (untouched)', () => {
  const { props } = post.e_user_id;
  expect(props.table).toBe(post);
  expect(props.name).toBe('e_user_id');
  expect(props.foreignColumn).toBe(user.id);
  expect(props).not.toBe(user.id.props);
  expect(props.nullable).toBe(false);
});

test('freeze', () => {
  const col = dd.int(234);
  col.freeze();
  expect(Object.isFrozen(col)).toBe(true);
  expect(Object.isFrozen(col.props)).toBe(true);
});

test('Column.spawnForeignColumn', () => {
  const a = user.id;
  let b = Column.spawnForeignColumn(a, post);
  // FK
  expect(b.props.foreignColumn).toBe(a);
  // name is cleared
  expect(b.props.name).toBeNull();
  // Value being reset
  expect(b.props.pk).toBe(false);
  expect(b.props.table).toBe(post);
  // props is copied
  expect(b.props).not.toBe(a.props);
  // props.types is copied
  expect(b.props.types).not.toBe(a.props.types);

  // Check equality
  expect(a.props.default).toBe(b.props.default);
  expect(a.props.types).toEqual(b.props.types);
  expect(a.props.nullable).toBe(b.props.nullable);
  expect(a.props.unique).toBe(b.props.unique);
});

test('Column.spawnJoinedColumn', () => {
  const t = (post.user_id.join(user) as unknown) as dd.JoinedTable;
  const a = user.name;
  const b = Column.spawnJoinedColumn(a, t);
  // mirroredColumn
  expect(b.props.mirroredColumn).toBe(a);
  // Value being reset
  expect(b.props.pk).toBe(false);
  expect(b.props.name).toBe(a.props.name);
  expect(b.props.table).toBe(t);
  // props is copied
  expect(b.props).not.toBe(a.props);
  // props.types is copied
  expect(b.props.types).not.toBe(a.props.types);

  // Check equality
  expect(a.props.default).toBe(b.props.default);
  expect(a.props.types).toEqual(b.props.types);
  expect(a.props.nullable).toBe(b.props.nullable);
  expect(a.props.unique).toBe(b.props.unique);
});

test('Mutate a frozen column', () => {
  const a = dd.int(234);
  a.freeze();
  expect(() => a.nullable).toThrow();
});

test('notNull (default)', () => {
  const c = dd.int(123);
  expect(c.props.nullable).toBe(false);
});

test('nullable', () => {
  const c = dd.int(123).nullable;
  expect(c.props.nullable).toBe(true);
});

test('unique', () => {
  const c = dd.int(123).unique;
  expect(c.props.unique).toBe(true);
});

test('unique (default)', () => {
  const c = dd.int(123);
  expect(c.props.unique).toBe(false);
});

test('setDefault', () => {
  let c = dd.int(123).setDefault('omg');
  expect(c.props.default).toBe('omg');

  c = dd.int(123).setDefault(null);
  expect(c.props.default).toBe(null);
});

test('Column.inputName', () => {
  expect(user.id.props.inputName()).toBe('userID');
  expect(user.snake_case_name.props.inputName()).toBe('userSnakeCaseName');
  expect(cmt.snake_case_post_id.props.inputName()).toBe(
    'postCmtSnakeCasePostID',
  );
});

test('ForeignColumn.inputName', () => {
  expect(post.snake_case_user_id.props.inputName()).toBe('postSnakeCaseUserID');
});

test('JoinedColumn.inputName', () => {
  expect(post.snake_case_user_id.join(user).id.props.inputName()).toBe(
    'postSnakeCaseUserID',
  );
  expect(post.snake_case_user_id.join(user).name.props.inputName()).toBe(
    'postSnakeCaseUserName',
  );
  expect(
    cmt.post_id
      .join(post)
      .user_id.join(user)
      .id.props.inputName(),
  ).toBe('postCmtPostUserID');
  expect(
    cmt.post_id
      .join(post)
      .snake_case_user_id.join(user)
      .name.props.inputName(),
  ).toBe('postCmtPostSnakeCaseUserName');
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

test('CalculatedColumn in table def', () => {
  expect(() => dd.table(SCTable)).toThrow('CalculatedColumn');
});
