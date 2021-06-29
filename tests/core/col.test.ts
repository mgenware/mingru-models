/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as assert from 'assert';
import { itThrows } from 'it-throws';
import * as mm from '../../dist/main.js';
import user from '../models/user.js';
import post from '../models/post.js';
import cmt from '../models/postCmt.js';
import employee from '../models/employee.js';
import { eq, deepEq, notEq } from '../assert-aliases.js';

it('Frozen after mm.table', () => {
  eq(Object.isFrozen(post.id), true);
  eq(Object.isFrozen(post.user_id), true);
  eq(Object.isFrozen(post.title), true);
});

it('Normal col', () => {
  const d = post.id.__getData();
  eq(d.name, 'id');
  eq(d.table, post);
  eq(post.id.toString(), 'Column(id, Table(post))');
});

it('Implicit FK', () => {
  const col = post.user_id;
  const d = col.__getData();
  eq(d.table, post);
  eq(d.name, 'user_id');
  eq(d.foreignColumn, user.id);
  notEq(d.type, user.id.__getData().type);
});

it('Explicit FK', () => {
  const col = post.e_user_id_n;
  const d = col.__getData();
  eq(d.table, post);
  eq(d.name, 'e_user_id_n');
  eq(d.foreignColumn, user.id);
  notEq(col, user.id.__mustGetType());
  eq(col.__mustGetType().nullable, true);
});

it('Explicit FK (untouched)', () => {
  const col = post.e_user_id;
  const d = col.__getData();
  eq(d.table, post);
  eq(d.name, 'e_user_id');
  eq(d.foreignColumn, user.id);
  notEq(col.__mustGetType(), user.id.__mustGetType());
  eq(col.__mustGetType().nullable, false);
});

it('freeze', () => {
  const col = mm.int(234);
  col.__freeze();
  eq(Object.isFrozen(col), true);
  eq(Object.isFrozen(col.__mustGetType()), true);
});

it('Column.newForeignColumn', () => {
  const a = user.id;
  const ad = a.__getData();
  const at = a.__mustGetType();
  const b = mm.Column.newForeignColumn(a, post);
  const bd = b.__getData();
  const bt = b.__mustGetType();
  // FK
  eq(bd.foreignColumn, a);
  // name is cleared
  eq(bd.name, undefined);
  // Value being reset
  eq(bt.pk, false);
  eq(bt.autoIncrement, false);
  eq(bd.table, post);
  // props are copied
  notEq(bd.type, ad.type);
  // props.types are copied
  notEq(bt.types, at.types);

  // Check equality
  eq(ad.defaultValue, bd.defaultValue);
  deepEq(at.types, bt.types);
  eq(at.nullable, bt.nullable);
});

it('Column.newJoinedColumn', () => {
  const t = post.user_id.join(user) as unknown as mm.JoinTable;
  const a = user.name;
  const ad = a.__getData();
  const at = a.__mustGetType();
  const b = mm.Column.newJoinedColumn(a, t);
  const bd = b.__getData();
  const bt = b.__mustGetType();
  // mirroredColumn
  eq(bd.mirroredColumn, a);
  // Value being reset
  eq(bt.pk, false);
  eq(bt.autoIncrement, false);
  eq(bd.name, ad.name);
  eq(bd.table, t);
  // props are copied
  notEq(bt, at);
  // props.types are copied
  notEq(bt.types, at.types);

  // Check equality
  eq(ad.defaultValue, bd.defaultValue);
  deepEq(at.types, bt.types);
  eq(at.nullable, bt.nullable);
});

it('Mutate a frozen column', () => {
  const a = mm.int(234);
  a.__freeze();
  itThrows(
    () => a.nullable,
    "Cannot assign to read only property 'nullable' of object '[object Object]'",
  );
});

it('notNull (default)', () => {
  const c = mm.int(123);
  eq(c.__mustGetType().nullable, false);
});

it('nullable', () => {
  const c = mm.int(123).nullable;
  eq(c.__mustGetType().nullable, true);
});

it('uniqueConstraint', () => {
  const c = mm.int(123).uniqueConstraint;
  eq(c.__getData().uniqueConstraint, true);
});

it('uniqueConstraint (default)', () => {
  const c = mm.int(123);
  eq(c.__getData().uniqueConstraint, undefined);
});

it('Index', () => {
  const c = mm.int(123).index;
  eq(c.__getData().index, true);
});

it('Index (default)', () => {
  const c = mm.int(123);
  eq(c.__getData().index, undefined);
});

it('Unique index', () => {
  const c = mm.int(123).uniqueIndex;
  eq(c.__getData().index, true);
  eq(c.__getData().isUniqueIndex, true);
});

it('Unique index (default)', () => {
  const c = mm.int(123);
  eq(c.__getData().index, undefined);
  eq(c.__getData().isUniqueIndex, undefined);
});

it('setDefault', () => {
  let c = mm.int(123).default('omg');
  eq(c.__getData().defaultValue, 'omg');

  c = mm.int(123).default(null);
  eq(c.__getData().defaultValue, null);
});

it('Column.inputName', () => {
  eq(user.id.__getInputName(), 'id');
  eq(user.snake_case_name.__getInputName(), 'snake_case_name');
  eq(cmt.snake_case_post_id.__getInputName(), 'snake_case_post_id');
});

it('ForeignColumn.inputName', () => {
  eq(post.snake_case_user_id.__getInputName(), 'snake_case_user_id');
});

it('JoinedColumn.inputName', () => {
  eq(post.snake_case_user_id.join(user).id.__getInputName(), 'snake_case_user_id');
  eq(post.snake_case_user_id.join(user).name.__getInputName(), 'snake_case_user_name');
  eq(cmt.post_id.join(post).user_id.join(user).id.__getInputName(), 'post_user_id');
  eq(
    cmt.post_id.join(post).snake_case_user_id.join(user).name.__getInputName(),
    'post_snake_case_user_name',
  );
});

class JCTable extends mm.Table {
  jc = post.user_id.join(user).name;
}

it('JoinedColumn in table def', () => {
  itThrows(
    () => mm.table(JCTable),
    'Unexpected table type "Column(name, (J|1|post|user)[user_id|id])". You should not use JoinedColumn in a table definition, JoinedColumn can only be used in SELECT actions. [column "jc"] [table "jc_table"]',
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
  eq(post.title.__getSourceTable(), post);
});

it('Column.mustGet', () => {
  class User extends mm.Table {
    id = mm.pk().setDBName('db_id');
  }
  const t = mm.table(User);
  const v = t.id;
  eq(v.__mustGetTable(), t);
  eq(v.__mustGetName(), 'id');
  itThrows(() => mm.pk().__mustGetName(), 'Column "Column()" doesn\'t have a name');
});

it('Column.attr n RawColumn.attr', () => {
  {
    class UserTA extends mm.TableActions {
      t = mm.selectRow(user.follower_count.attr(1, true).attr(2, 's').attr(1, 3).attr(4, 3));
    }
    const table = mm.tableActions(user, UserTA);
    const { t } = table;
    const columns = t.__getData().columns!;
    const rd = (columns[0] as mm.RawColumn).__getData();
    eq(rd.core, user.follower_count);
    deepEq(
      rd.attrs,
      new Map<number, unknown>([
        [1, 3],
        [2, 's'],
        [4, 3],
      ]),
    );
  }
  {
    class UserTA extends mm.TableActions {
      t = mm.selectRow(user.follower_count.attr(1, true).attr(2, 's').attr(1, 3).attr(4, 3));
    }
    const table = mm.tableActions(user, UserTA);
    const { t } = table;
    const columns = t.__getData().columns!;
    const rd = (columns[0] as mm.RawColumn).__getData();
    eq(rd.core, user.follower_count);
    deepEq(
      rd.attrs,
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
      t = mm.selectRow(user.follower_count.attr(1, true).attr(2, 's').attr(1, 3).privateAttr());
    }
    const table = mm.tableActions(user, UserTA);
    const { t } = table;
    const columns = t.__getData().columns!;
    const rd = (columns[0] as mm.RawColumn).__getData();
    eq(rd.core, user.follower_count);
    deepEq(
      rd.attrs,
      new Map<number, unknown>([
        [1, 3],
        [2, 's'],
        [mm.ColumnAttribute.isPrivate, true],
      ]),
    );
  }
  {
    class UserTA extends mm.TableActions {
      t = mm.selectRow(user.follower_count.attr(1, true).attr(2, 's').attr(1, 3).privateAttr());
    }
    const table = mm.tableActions(user, UserTA);
    const { t } = table;
    const columns = t.__getData().columns!;
    const rd = (columns[0] as mm.RawColumn).__getData();
    eq(rd.core, user.follower_count);
    deepEq(
      rd.attrs,
      new Map<number, unknown>([
        [1, 3],
        [2, 's'],
        [mm.ColumnAttribute.isPrivate, true],
      ]),
    );
  }
});

it('Column.getPath', () => {
  eq(user.id.__getPath(), 'user.id');
  eq(employee.id.__getPath(), 'employees.emp_no');
  eq(post.user_id.join(user).name.__getPath(), '(J|1|post|user)[user_id|id].name');
  eq(
    post.title
      .join(user, user.name, [
        [post.user_id, user.id],
        [post.snake_case_user_id, user.id],
      ])
      .follower_count.__getPath(),
    '(J|1|post|user)[title|name][user_id|id][snake_case_user_id|id].follower_count',
  );
});

it('Nullable FK', () => {
  class Post extends mm.Table {
    id = mm.pk();
    user_id = mm.fk(user.id).nullable;
  }
  const myPost = mm.table(Post);

  const t = myPost.user_id;
  const d = t.__getData();
  eq(d.foreignColumn, user.id);
  eq(t.__mustGetType().nullable, true);
});
