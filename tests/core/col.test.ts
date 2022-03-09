/* eslint-disable @typescript-eslint/no-non-null-assertion */
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
  eq(d.propertyName, 'id');
  eq(d.table, post);
  eq(post.id.toString(), 'Column(id, t=Post(post))');
});

it('Implicit FK', () => {
  const col = post.user_id;
  const d = col.__getData();
  eq(d.table, post);
  eq(d.propertyName, 'user_id');
  eq(d.foreignColumn, user.id);
  notEq(d.type, user.id.__getData().type);
});

it('Explicit FK', () => {
  const col = post.e_user_id_n;
  const d = col.__getData();
  eq(d.table, post);
  eq(d.propertyName, 'e_user_id_n');
  eq(d.foreignColumn, user.id);
  notEq(col, user.id.__type());
  eq(col.__type().nullable, true);
});

it('Explicit FK (untouched)', () => {
  const col = post.e_user_id;
  const d = col.__getData();
  eq(d.table, post);
  eq(d.propertyName, 'e_user_id');
  eq(d.foreignColumn, user.id);
  notEq(col.__type(), user.id.__type());
  eq(col.__type().nullable, false);
});

it('freeze', () => {
  const col = mm.int(234);
  col.__freeze();
  eq(Object.isFrozen(col), true);
  eq(Object.isFrozen(col.__type()), true);
});

it('new Column(ColumnType)', () => {
  const col = new mm.Column(user.id.__type());

  const t = col.__type();
  eq(t.pk, false);
  eq(t.autoIncrement, false);
  notEq(t, user.id.__type());
});

it('Column.newForeignColumn', () => {
  const a = user.id;
  const ad = a.__getData();
  const at = a.__type();
  const b = mm.Column.newForeignColumn(a);
  const bd = b.__getData();
  const bt = b.__type();
  // FK
  eq(bd.foreignColumn, a);
  // name is cleared
  eq(bd.propertyName, undefined);
  // Value being reset
  eq(bt.pk, false);
  eq(bt.autoIncrement, false);
  eq(bd.table, undefined);
  // props are copied
  notEq(bd.type, ad.type);

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
  eq(c.__type().nullable, false);
});

it('nullable', () => {
  const c = mm.int(123).nullable;
  eq(c.__type().nullable, true);
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

it('Column.modelName', () => {
  eq(user.id.__getModelName(), 'id');
  eq(user.snake_case_name.__getModelName(), 'snake_case_name');
  eq(cmt.snake_case_post_id.__getModelName(), 'snake_case_post_id');
});

it('ForeignColumn.modelName', () => {
  eq(post.snake_case_user_id.__getModelName(), 'snake_case_user_id');
});

it('JoinedColumn.modelName', () => {
  eq(post.snake_case_user_id.join(user).id.__getModelName(), 'snake_case_user_id');
  eq(post.snake_case_user_id.join(user).name.__getModelName(), 'snake_case_user_name');
  eq(cmt.post_id.join(post).user_id.join(user).id.__getModelName(), 'post_user_id');
  eq(
    cmt.post_id.join(post).snake_case_user_id.join(user).name.__getModelName(),
    'post_snake_case_user_name',
  );
});

class JCTable extends mm.Table {
  jc = post.user_id.join(user).name;
}

it('JoinedColumn in table def', () => {
  itThrows(
    () => mm.table(JCTable),
    'Unexpected table type "Column(name, t=JoinTable((J|1|post|user)[user_id|id]))". You should not use JoinedColumn in a table definition, JoinedColumn can only be used in SELECT actions. [column "jc"] [table "jc_table"]',
  );
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
  eq(v.__mustGetPropertyName(), 'id');
  itThrows(() => mm.pk().__mustGetPropertyName(), 'Column "Column(-)" doesn\'t have a name');
});

it('Column.attr n SelectedColumn.attr', () => {
  {
    class UserTA extends mm.TableActions {
      t = mm.selectRow(user.follower_count.attr(1, true).attr(2, 's').attr(1, 3).attr(4, 3));
    }
    const table = mm.tableActions(user, UserTA);
    const { t } = table;
    const columns = t.__getData().columns!;
    const rd = (columns[0] as mm.SelectedColumn).__getData();
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
    const rd = (columns[0] as mm.SelectedColumn).__getData();
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

it('Column.colAttr', () => {
  {
    class T extends mm.Table {
      id = mm.pk();
      name = mm
        .varChar(100)
        .colAttr(mm.ColumnAttribute.alias, 'haha')
        .colAttr(100 as mm.ColumnAttribute.alias, 'val');
    }
    const table = mm.table(T);
    const rd = table.name.__getData();
    deepEq(
      rd.attrs,
      new Map<number, unknown>([
        [0, 'haha'],
        [100, 'val'],
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
    const rd = (columns[0] as mm.SelectedColumn).__getData();
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

it('Column.privateAttr n SelectedColumn.privateAttr', () => {
  {
    class UserTA extends mm.TableActions {
      t = mm.selectRow(user.follower_count.attr(1, true).attr(2, 's').attr(1, 3).privateAttr());
    }
    const table = mm.tableActions(user, UserTA);
    const { t } = table;
    const columns = t.__getData().columns!;
    const rd = (columns[0] as mm.SelectedColumn).__getData();
    eq(rd.core, user.follower_count);
    deepEq(
      rd.attrs,
      new Map<number, unknown>([
        [1, 3],
        [2, 's'],
        [mm.SelectedColumnAttribute.isPrivate, true],
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
    const rd = (columns[0] as mm.SelectedColumn).__getData();
    eq(rd.core, user.follower_count);
    deepEq(
      rd.attrs,
      new Map<number, unknown>([
        [1, 3],
        [2, 's'],
        [mm.SelectedColumnAttribute.isPrivate, true],
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
  eq(t.__type().nullable, true);
});
