import * as assert from 'assert';
import { itThrows } from 'it-throws';
import * as mm from '../..';
import user from '../models/user';
import post from '../models/post';
import cmt from '../models/postCmt';
import employee from '../models/employee';
import { eq, deepEq, notEq } from '../assert-aliases';

it('Frozen after mm.table', () => {
  eq(Object.isFrozen(post.id), true);
  eq(Object.isFrozen(post.user_id), true);
  eq(Object.isFrozen(post.title), true);
});

it('Normal col', () => {
  eq(post.id.__name, 'id');
  eq(post.id.__table, post);
  eq(post.id.toString(), 'Column(id, Table(post))');
});

it('Implicit FK', () => {
  const col = post.user_id;
  eq(col.__table, post);
  eq(col.__name, 'user_id');
  eq(col.__foreignColumn, user.id);
  notEq(col.__type, user.id.__type);
});

it('Explicit FK', () => {
  const col = post.e_user_id_n;
  eq(col.__table, post);
  eq(col.__name, 'e_user_id_n');
  eq(col.__foreignColumn, user.id);
  notEq(col, user.id.__type);
  eq(col.__type.nullable, true);
});

it('Explicit FK (untouched)', () => {
  const col = post.e_user_id;
  eq(col.__table, post);
  eq(col.__name, 'e_user_id');
  eq(col.__foreignColumn, user.id);
  notEq(col.__type, user.id.__type);
  eq(col.__type.nullable, false);
});

it('freeze', () => {
  const col = mm.int(234);
  col.__freeze();
  eq(Object.isFrozen(col), true);
  eq(Object.isFrozen(col.__type), true);
});

it('Column.newForeignColumn', () => {
  const a = user.id;
  const b = mm.Column.newForeignColumn(a, post);
  // FK
  eq(b.__foreignColumn, a);
  // name is cleared
  eq(b.__name, null);
  // Value being reset
  eq(b.__type.pk, false);
  eq(b.__type.autoIncrement, false);
  eq(b.__table, post);
  // props is copied
  notEq(b.__type, a.__type);
  // props.types is copied
  notEq(b.__type.types, a.__type.types);

  // Check equality
  eq(a.__defaultValue, b.__defaultValue);
  deepEq(a.__type.types, b.__type.types);
  eq(a.__type.nullable, b.__type.nullable);
  eq(a.__type.unique, b.__type.unique);
});

it('Column.newJoinedColumn', () => {
  const t = (post.user_id.join(user) as unknown) as mm.JoinedTable;
  const a = user.name;
  const b = mm.Column.newJoinedColumn(a, t);
  // mirroredColumn
  eq(b.__mirroredColumn, a);
  // Value being reset
  eq(b.__type.pk, false);
  eq(b.__type.autoIncrement, false);
  eq(b.__name, a.__name);
  eq(b.__table, t);
  // props is copied
  notEq(b.__type, a.__type);
  // props.types is copied
  notEq(b.__type.types, a.__type.types);

  // Check equality
  eq(a.__defaultValue, b.__defaultValue);
  deepEq(a.__type.types, b.__type.types);
  eq(a.__type.nullable, b.__type.nullable);
  eq(a.__type.unique, b.__type.unique);
});

it('Mutate a frozen column', () => {
  const a = mm.int(234);
  a.__freeze();
  itThrows(
    () => a.nullable,
    'The current column "null" of type Column cannot be modified, it is frozen. It is mostly likely because you are modifying a column from another table',
  );
});

it('notNull (default)', () => {
  const c = mm.int(123);
  eq(c.__type.nullable, false);
});

it('nullable', () => {
  const c = mm.int(123).nullable;
  eq(c.__type.nullable, true);
});

it('unique', () => {
  const c = mm.int(123).unique;
  eq(c.__type.unique, true);
});

it('unique (default)', () => {
  const c = mm.int(123);
  eq(c.__type.unique, false);
});

it('setDefault', () => {
  let c = mm.int(123).default('omg');
  eq(c.__defaultValue, 'omg');

  c = mm.int(123).default(null);
  eq(c.__defaultValue, null);
});

it('Column.inputName', () => {
  eq(user.id.getInputName(), 'id');
  eq(user.snake_case_name.getInputName(), 'snake_case_name');
  eq(cmt.snake_case_post_id.getInputName(), 'snake_case_post_id');
});

it('ForeignColumn.inputName', () => {
  eq(post.snake_case_user_id.getInputName(), 'snake_case_user_id');
});

it('JoinedColumn.inputName', () => {
  eq(post.snake_case_user_id.join(user).id.getInputName(), 'snake_case_user_id');
  eq(post.snake_case_user_id.join(user).name.getInputName(), 'snake_case_user_name');
  eq(cmt.post_id.join(post).user_id.join(user).id.getInputName(), 'post_user_id');
  eq(
    cmt.post_id.join(post).snake_case_user_id.join(user).name.getInputName(),
    'post_snake_case_user_name',
  );
});

class JCTable extends mm.Table {
  jc = post.user_id.join(user).name;
}

it('JoinedColumn in table def', () => {
  itThrows(
    () => mm.table(JCTable),
    'Unexpected table type "Column". You should not use JoinedColumn in a table definition, JoinedColumn can only be used in SELECT actions. [column "jc"] [table "jc_table"]',
  );
});

it('Throw on default value of complex SQL', () => {
  assert.doesNotThrow(() => {
    class T extends mm.Table {
      t = mm.varChar(23).default(mm.localDatetimeNow());
    }
    mm.table(T);
  });
});

it('getSourceTable', () => {
  eq(post.title.getSourceTable(), post);
});

it('Column.mustGet', () => {
  class User extends mm.Table {
    id = mm.pk().setDBName('db_id');
  }
  const t = mm.table(User);
  const v = t.id;
  eq(v.mustGetTable(), t);
  eq(v.mustGetName(), 'id');
  itThrows(() => mm.pk().mustGetName(), 'Column "Column" doesn\'t have a name');
});

it('Column.attr n RawColumn.attr', () => {
  {
    class UserTA extends mm.TableActions {
      t = mm.select(user.follower_count.attr(1, true).attr(2, 's').attr(1, 3).attr(4, 3));
    }
    const table = mm.tableActions(user, UserTA);
    const t = table.t as mm.SelectAction;
    eq((t.columns[0] as mm.RawColumn).core, user.follower_count);
    deepEq(
      (t.columns[0] as mm.RawColumn).__attrs,
      new Map<number, unknown>([
        [1, 3],
        [2, 's'],
        [4, 3],
      ]),
    );
  }
  {
    class UserTA extends mm.TableActions {
      t = mm.select(user.follower_count.attr(1, true).attr(2, 's').attr(1, 3).attr(4, 3));
    }
    const table = mm.tableActions(user, UserTA);
    const t = table.t as mm.SelectAction;
    eq((t.columns[0] as mm.RawColumn).core, user.follower_count);
    deepEq(
      (t.columns[0] as mm.RawColumn).__attrs,
      new Map<number, unknown>([
        [1, 3],
        [2, 's'],
        [4, 3],
      ]),
    );
  }
});

it('Column.privateAttr n RawColumn.privateAttr', () => {
  {
    class UserTA extends mm.TableActions {
      t = mm.select(user.follower_count.attr(1, true).attr(2, 's').attr(1, 3).privateAttr());
    }
    const table = mm.tableActions(user, UserTA);
    const t = table.t as mm.SelectAction;
    eq((t.columns[0] as mm.RawColumn).core, user.follower_count);
    deepEq(
      (t.columns[0] as mm.RawColumn).__attrs,
      new Map<number, unknown>([
        [1, 3],
        [2, 's'],
        [mm.ColumnAttribute.isPrivate, true],
      ]),
    );
  }
  {
    class UserTA extends mm.TableActions {
      t = mm.select(user.follower_count.attr(1, true).attr(2, 's').attr(1, 3).privateAttr());
    }
    const table = mm.tableActions(user, UserTA);
    const t = table.t as mm.SelectAction;
    eq((t.columns[0] as mm.RawColumn).core, user.follower_count);
    deepEq(
      (t.columns[0] as mm.RawColumn).__attrs,
      new Map<number, unknown>([
        [1, 3],
        [2, 's'],
        [mm.ColumnAttribute.isPrivate, true],
      ]),
    );
  }
});

it('Column.getPath', () => {
  eq(user.id.getPath(), 'user.id');
  eq(employee.id.getPath(), 'employees.emp_no');
  eq(post.user_id.join(user).name.getPath(), '(J|0|post|user)[user_id|id].name');
  eq(
    post.title
      .join(user, user.name, [
        [post.user_id, user.id],
        [post.snake_case_user_id, user.id],
      ])
      .follower_count.getPath(),
    '(J|0|post|user)[title|name][user_id|id][snake_case_user_id|id].follower_count',
  );
});

it('Nullable FK', () => {
  class Post extends mm.Table {
    id = mm.pk();
    user_id = mm.fk(user.id).nullable;
  }
  const myPost = mm.table(Post);

  const t = myPost.user_id;
  eq(t.__foreignColumn, user.id);
  eq(t.__type.nullable, true);
});
