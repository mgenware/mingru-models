import * as mm from '../../';
import user from '../models/user';
import post from '../models/post';
import cmt from '../models/postCmt';
import * as assert from 'assert';

const expect = assert.equal;

it('Frozen after mm.table', () => {
  expect(Object.isFrozen(post.id), true);
  expect(Object.isFrozen(post.user_id), true);
  expect(Object.isFrozen(post.title), true);
});

it('Normal col', () => {
  expect(post.id.__name, 'id');
  expect(post.id.__table, post);
  expect(post.id.toString(), 'Column(id, Table(post))');
});

it('Implicit FK', () => {
  const col = post.user_id;
  expect(col.__table, post);
  expect(col.__name, 'user_id');
  expect(col.foreignColumn, user.id);
  assert.notEqual(col.type, user.id.type);
});

it('Explicit FK', () => {
  const col = post.e_user_id_n;
  expect(col.__table, post);
  expect(col.__name, 'e_user_id_n');
  expect(col.foreignColumn, user.id);
  assert.notEqual(col, user.id.type);
  expect(col.type.nullable, true);
});

it('Explicit FK (untouched)', () => {
  const col = post.e_user_id;
  expect(col.__table, post);
  expect(col.__name, 'e_user_id');
  expect(col.foreignColumn, user.id);
  assert.notEqual(col.type, user.id.type);
  expect(col.type.nullable, false);
});

it('freeze', () => {
  const col = mm.int(234);
  col.freeze();
  expect(Object.isFrozen(col), true);
  expect(Object.isFrozen(col.type), true);
});

it('Column.newForeignColumn', () => {
  const a = user.id;
  const b = mm.Column.newForeignColumn(a, post);
  // FK
  expect(b.foreignColumn, a);
  // name is cleared
  expect(b.__name, null);
  // Value being reset
  expect(b.type.pk, false);
  expect(b.type.autoIncrement, false);
  expect(b.__table, post);
  // props is copied
  assert.notEqual(b.type, a.type);
  // props.types is copied
  assert.notEqual(b.type.types, a.type.types);

  // Check equality
  expect(a.defaultValue, b.defaultValue);
  assert.deepEqual(a.type.types, b.type.types);
  expect(a.type.nullable, b.type.nullable);
  expect(a.type.unique, b.type.unique);
});

it('Column.newJoinedColumn', () => {
  const t = (post.user_id.join(user) as unknown) as mm.JoinedTable;
  const a = user.name;
  const b = mm.Column.newJoinedColumn(a, t);
  // mirroredColumn
  expect(b.mirroredColumn, a);
  // Value being reset
  expect(b.type.pk, false);
  expect(b.type.autoIncrement, false);
  expect(b.__name, a.__name);
  expect(b.__table, t);
  // props is copied
  assert.notEqual(b.type, a.type);
  // props.types is copied
  assert.notEqual(b.type.types, a.type.types);

  // Check equality
  expect(a.defaultValue, b.defaultValue);
  assert.deepEqual(a.type.types, b.type.types);
  expect(a.type.nullable, b.type.nullable);
  expect(a.type.unique, b.type.unique);
});

it('Mutate a frozen column', () => {
  const a = mm.int(234);
  a.freeze();
  assert.throws(() => a.nullable);
});

it('notNull (default)', () => {
  const c = mm.int(123);
  expect(c.type.nullable, false);
});

it('nullable', () => {
  const c = mm.int(123).nullable;
  expect(c.type.nullable, true);
});

it('unique', () => {
  const c = mm.int(123).unique;
  expect(c.type.unique, true);
});

it('unique (default)', () => {
  const c = mm.int(123);
  expect(c.type.unique, false);
});

it('setDefault', () => {
  let c = mm.int(123).setDefault('omg');
  expect(c.defaultValue, 'omg');

  c = mm.int(123).setDefault(null);
  expect(c.defaultValue, null);
});

it('Column.inputName', () => {
  expect(user.id.inputName(), 'id');
  expect(user.snake_case_name.inputName(), 'snakeCaseName');
  expect(cmt.snake_case_post_id.inputName(), 'snakeCasePostID');
});

it('ForeignColumn.inputName', () => {
  expect(post.snake_case_user_id.inputName(), 'snakeCaseUserID');
});

it('JoinedColumn.inputName', () => {
  expect(post.snake_case_user_id.join(user).id.inputName(), 'snakeCaseUserID');
  expect(
    post.snake_case_user_id.join(user).name.inputName(),
    'snakeCaseUserName',
  );
  expect(
    cmt.post_id
      .join(post)
      .user_id.join(user)
      .id.inputName(),
    'postUserID',
  );
  expect(
    cmt.post_id
      .join(post)
      .snake_case_user_id.join(user)
      .name.inputName(),
    'postSnakeCaseUserName',
  );
});

class JCTable extends mm.Table {
  jc = post.user_id.join(user).name;
}

it('JoinedColumn in table def', () => {
  assert.throws(() => mm.table(JCTable), 'JoinedColumn');
});

class SCTable extends mm.Table {
  sc = mm.int().as('haha');
}

it('RawColumn in table def', () => {
  assert.throws(() => mm.table(SCTable), 'RawColumn');
});

it('Register property callback', () => {
  let counter = 0;
  const cb = () => counter++;
  const col = new mm.Column(new mm.ColumnType('abc'));
  // Register the callback twice
  mm.CoreProperty.registerHandler(col, cb);
  mm.CoreProperty.registerHandler(col, cb);
  class User extends mm.Table {
    t = col;
  }

  assert.deepEqual(col.__handlers, [cb, cb]);
  expect(counter, 0);
  mm.table(User);
  expect(col.__handlers, null);
  expect(counter, 2);
});

it('Register property callback on a initialized property', () => {
  let counter = 0;
  const cb = () => counter++;
  mm.CoreProperty.registerHandler(user.name, cb);
  expect(user.name.__handlers, null);
  expect(counter, 1);
});

it('Throw on default value of complex SQL', () => {
  assert.doesNotThrow(() => {
    class T extends mm.Table {
      t = mm.varChar(23).setDefault(mm.datetimeNow());
    }
    mm.table(T);
  });
  assert.throws(() => {
    class T extends mm.Table {
      t = mm.varChar(23).setDefault(mm.sql`${user.name}`);
    }
    mm.table(T);
  }, 'complex SQL');
});

it('getSourceTable', () => {
  expect(post.title.getSourceTable(), post);
});

it('Coluumn.ensureInitialized', () => {
  class User extends mm.Table {
    id = mm.pk().setDBName('db_id');
  }
  const t = mm.table(User);
  const v = t.id;
  assert.deepEqual(v.ensureInitialized(), [t, 'id']);
  assert.throws(() => mm.pk().ensureInitialized(), 'not initialized');
});
