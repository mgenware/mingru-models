import * as assert from 'assert';
import { itThrows } from 'it-throws';
import * as mm from '../..';
import user from '../models/user';
import post from '../models/post';
import cmt from '../models/postCmt';

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
  expect(col.__foreignColumn, user.id);
  assert.notEqual(col.__type, user.id.__type);
});

it('Explicit FK', () => {
  const col = post.e_user_id_n;
  expect(col.__table, post);
  expect(col.__name, 'e_user_id_n');
  expect(col.__foreignColumn, user.id);
  assert.notEqual(col, user.id.__type);
  expect(col.__type.nullable, true);
});

it('Explicit FK (untouched)', () => {
  const col = post.e_user_id;
  expect(col.__table, post);
  expect(col.__name, 'e_user_id');
  expect(col.__foreignColumn, user.id);
  assert.notEqual(col.__type, user.id.__type);
  expect(col.__type.nullable, false);
});

it('freeze', () => {
  const col = mm.int(234);
  col.freeze();
  expect(Object.isFrozen(col), true);
  expect(Object.isFrozen(col.__type), true);
});

it('Column.newForeignColumn', () => {
  const a = user.id;
  const b = mm.Column.newForeignColumn(a, post);
  // FK
  expect(b.__foreignColumn, a);
  // name is cleared
  expect(b.__name, null);
  // Value being reset
  expect(b.__type.pk, false);
  expect(b.__type.autoIncrement, false);
  expect(b.__table, post);
  // props is copied
  assert.notEqual(b.__type, a.__type);
  // props.types is copied
  assert.notEqual(b.__type.types, a.__type.types);

  // Check equality
  expect(a.__defaultValue, b.__defaultValue);
  assert.deepEqual(a.__type.types, b.__type.types);
  expect(a.__type.nullable, b.__type.nullable);
  expect(a.__type.unique, b.__type.unique);
});

it('Column.newJoinedColumn', () => {
  const t = (post.user_id.join(user) as unknown) as mm.JoinedTable;
  const a = user.name;
  const b = mm.Column.newJoinedColumn(a, t);
  // mirroredColumn
  expect(b.__mirroredColumn, a);
  // Value being reset
  expect(b.__type.pk, false);
  expect(b.__type.autoIncrement, false);
  expect(b.__name, a.__name);
  expect(b.__table, t);
  // props is copied
  assert.notEqual(b.__type, a.__type);
  // props.types is copied
  assert.notEqual(b.__type.types, a.__type.types);

  // Check equality
  expect(a.__defaultValue, b.__defaultValue);
  assert.deepEqual(a.__type.types, b.__type.types);
  expect(a.__type.nullable, b.__type.nullable);
  expect(a.__type.unique, b.__type.unique);
});

it('Mutate a frozen column', () => {
  const a = mm.int(234);
  a.freeze();
  itThrows(
    () => a.nullable,
    'The current column "null" of type Column cannot be modified, it is frozen. It is mostly likely because you are modifying a column from another table',
  );
});

it('notNull (default)', () => {
  const c = mm.int(123);
  expect(c.__type.nullable, false);
});

it('nullable', () => {
  const c = mm.int(123).nullable;
  expect(c.__type.nullable, true);
});

it('unique', () => {
  const c = mm.int(123).unique;
  expect(c.__type.unique, true);
});

it('unique (default)', () => {
  const c = mm.int(123);
  expect(c.__type.unique, false);
});

it('setDefault', () => {
  let c = mm.int(123).default('omg');
  expect(c.__defaultValue, 'omg');

  c = mm.int(123).default(null);
  expect(c.__defaultValue, null);
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
    cmt.post_id.join(post).user_id.join(user).id.inputName(),
    'postUserID',
  );
  expect(
    cmt.post_id.join(post).snake_case_user_id.join(user).name.inputName(),
    'postSnakeCaseUserName',
  );
});

class JCTable extends mm.Table {
  jc = post.user_id.join(user).name;
}

it('JoinedColumn in table def', () => {
  itThrows(
    () => mm.table(JCTable),
    'Unexpected table type "Column". You should not use JoinedColumn in a table definition, JoinedColumn can only be used in SELECT actions. [column "jc"]',
  );
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
      t = mm.varChar(23).default(mm.localDatetimeNow());
    }
    mm.table(T);
  });
  itThrows(() => {
    class T extends mm.Table {
      t = mm.varChar(23).default(mm.sql`${user.name}`);
    }
    mm.table(T);
  }, 'Default value cannot be a complex SQL expression [column "t"]');
});

it('getSourceTable', () => {
  expect(post.title.getSourceTable(), post);
});

it('Column.ensureInitialized', () => {
  class User extends mm.Table {
    id = mm.pk().setDBName('db_id');
  }
  const t = mm.table(User);
  const v = t.id;
  assert.deepEqual(v.ensureInitialized(), [t, 'id']);
  itThrows(
    () => mm.pk().ensureInitialized(),
    'Column "Column(null|, <null>)" is not initialized',
  );
});

it('Column.attr/attrs n RawColumn.attr/attrs', () => {
  {
    class UserTA extends mm.TableActions {
      t = mm.select(
        user.follower_count
          .attr('a', true)
          .attrs({ a: 3, b: 's' })
          .attr('d', 3),
      );
    }
    const table = mm.tableActions(user, UserTA);
    const t = table.t as mm.SelectAction;
    assert.equal((t.columns[0] as mm.RawColumn).core, user.follower_count);
    assert.deepEqual((t.columns[0] as mm.RawColumn).__attrs, {
      a: 3,
      b: 's',
      d: 3,
    });
  }
  {
    class UserTA extends mm.TableActions {
      t = mm.select(
        user.follower_count
          .attrs({ a: true })
          .attrs({ a: 3, b: 's' })
          .attr('d', 3),
      );
    }
    const table = mm.tableActions(user, UserTA);
    const t = table.t as mm.SelectAction;
    assert.equal((t.columns[0] as mm.RawColumn).core, user.follower_count);
    assert.deepEqual((t.columns[0] as mm.RawColumn).__attrs, {
      a: 3,
      b: 's',
      d: 3,
    });
  }
});

it('Column.privateAttr n RawColumn.privateAttr', () => {
  {
    class UserTA extends mm.TableActions {
      t = mm.select(
        user.follower_count
          .attr('a', true)
          .attrs({ a: 3, b: 's' })
          .privateAttr(),
      );
    }
    const table = mm.tableActions(user, UserTA);
    const t = table.t as mm.SelectAction;
    assert.equal((t.columns[0] as mm.RawColumn).core, user.follower_count);
    assert.deepEqual((t.columns[0] as mm.RawColumn).__attrs, {
      a: 3,
      b: 's',
      [mm.ColumnAttributes.isPrivate]: true,
    });
  }
  {
    class UserTA extends mm.TableActions {
      t = mm.select(
        user.follower_count
          .attrs({ a: true })
          .attrs({ a: 3, b: 's' })
          .privateAttr(),
      );
    }
    const table = mm.tableActions(user, UserTA);
    const t = table.t as mm.SelectAction;
    assert.equal((t.columns[0] as mm.RawColumn).core, user.follower_count);
    assert.deepEqual((t.columns[0] as mm.RawColumn).__attrs, {
      a: 3,
      b: 's',
      [mm.ColumnAttributes.isPrivate]: true,
    });
  }
});
