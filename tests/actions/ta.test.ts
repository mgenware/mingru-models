import * as mm from '../..';
import user from '../models/user';
import post from '../models/post';
import { eq, ok, deepEq } from '../assert-aliases';

it('Core props', () => {
  class UserTA extends mm.TableActions {
    t = mm.selectRow(user.id);
    t2 = mm.selectRow(post.id).from(post);
  }
  const ta = mm.tableActions(user, UserTA);
  let v = ta.t;
  eq(v.__name, 't');
  eq(v.__groupTable, user);
  eq(v.__sqlTable, null);
  eq(v.mustGetGroupTable(), user);
  eq(v.mustGetAvailableSQLTable(user), user);
  eq(v.mustGetName(), 't');

  v = ta.t2;
  eq(v.__name, 't2');
  eq(v.__groupTable, user);
  eq(v.__sqlTable, post);
  eq(v.mustGetGroupTable(), user);
  eq(v.mustGetAvailableSQLTable(user), post);
  eq(v.mustGetName(), 't2');
});

it('enumerateActions', () => {
  class UserTA extends mm.TableActions {
    upd = mm
      .unsafeUpdateAll()
      .set(user.name, mm.sql`${mm.input(user.name)}`)
      .set(user.follower_count, mm.sql`${user.follower_count} + 1`);

    sel = mm.selectRow(user.id);
    nonAction = 10;
    emptyAction = mm.emptyAction;
  }
  const ta = mm.tableActions(user, UserTA);
  deepEq(ta.__actions, {
    upd: ta.upd,
    sel: ta.sel,
  });
});

it('Argument stubs', () => {
  const stubs = [
    new mm.SQLVariable({ type: 'int', defaultValue: 0 }, 'id'),
    new mm.SQLVariable({ type: 'int', defaultValue: 0 }, 'id2'),
  ];
  class UserTA extends mm.TableActions {
    t = mm.selectRow(user.id).argStubs(...stubs);
  }
  const ta = mm.tableActions(user, UserTA);

  const v = ta.t;
  deepEq(v.__argStubs, stubs);
});

class MyInsertAction extends mm.InsertAction {
  groupTable: mm.Table | null = null;
  constructor() {
    super(true);
  }

  validate(groupTable: mm.Table) {
    super.validate(groupTable);
    this.groupTable = groupTable;
  }
}

it('Action.onInit', () => {
  class UserTA extends mm.TableActions {
    t = new MyInsertAction().setInputs();
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  eq(v.groupTable, user);
});

it('Action.onInit (from)', () => {
  class UserTA extends mm.TableActions {
    t = new MyInsertAction().from(post).setInputs();
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  eq(v.groupTable, user);
});

it('Action.attr/attrs', () => {
  {
    class UserTA extends mm.TableActions {
      t = mm
        .selectRow(mm.sel(mm.sql`1`, 'col'))
        .attr(1, true)
        .attr(3, 4)
        .attr(2, 's');
    }
    const table = mm.tableActions(user, UserTA);
    deepEq(
      table.t.__attrs,
      new Map<number, unknown>([
        [1, true],
        [2, 's'],
        [3, 4],
      ]),
    );
  }
  {
    class UserTA extends mm.TableActions {
      t = mm
        .selectRow(mm.sel(mm.sql`1`, 'col'))
        .attr(1, true)
        .attr(2, 4)
        .attr(1, 's')
        .attr(3, 5);
    }
    const table = mm.tableActions(user, UserTA);
    deepEq(
      table.t.__attrs,
      new Map<number, unknown>([
        [1, 's'],
        [2, 4],
        [3, 5],
      ]),
    );
  }
});

it('Action.privateAttr', () => {
  class UserTA extends mm.TableActions {
    t = mm
      .selectRow(mm.sel(mm.sql`1`, 'col'))
      .attr(1, true)
      .attr(3, 4)
      .attr(2, 's')
      .privateAttr();
  }
  const table = mm.tableActions(user, UserTA);
  deepEq(
    table.t.__attrs,
    new Map<number, unknown>([
      [1, true],
      [2, 's'],
      [3, 4],
      [mm.ActionAttribute.isPrivate, true],
    ]),
  );
});

it('Action.resultTypeNameAttr', () => {
  class UserTA extends mm.TableActions {
    t = mm
      .selectRow(mm.sel(mm.sql`1`, 'col'))
      .attr(1, true)
      .attr(3, 4)
      .attr(2, 's')
      .privateAttr()
      .resultTypeNameAttr('aaa');
  }
  const table = mm.tableActions(user, UserTA);
  deepEq(
    table.t.__attrs,
    new Map<number, unknown>([
      [1, true],
      [2, 's'],
      [3, 4],
      [mm.ActionAttribute.isPrivate, true],
      [mm.ActionAttribute.resultTypeName, 'aaa'],
    ]),
  );
});

it('__actions and props', () => {
  class UserTA extends mm.TableActions {
    upd = mm
      .unsafeUpdateAll()
      .set(user.name, mm.sql`${mm.input(user.name)}`)
      .set(user.follower_count, mm.sql`${user.follower_count} + 1`);

    sel = mm.selectRow(user.id);
  }
  const ta = mm.tableActions(user, UserTA);

  eq(ta.__table, user);
  eq(ta instanceof mm.TableActions, true);
  deepEq(ta.__actions, {
    upd: ta.upd,
    sel: ta.sel,
  });
  for (const [name, action] of Object.entries(ta.__actions)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eq((ta as any)[name], action);
  }
});

it('__actions and props (taCore)', () => {
  const sel = mm.selectRow();
  const del = mm.deleteOne().by(user.id);
  const actions: Record<string, mm.Action> = {
    del,
    sel,
  };
  const ta = mm.tableActionsCore(user, null, actions, undefined);

  eq(ta.__table, user);
  eq(ta instanceof mm.TableActions, true);
  deepEq(ta.__actions, actions);
  // `tableActionsCore` never add property into table actions.
  for (const [name] of Object.entries(ta.__actions)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eq((ta as any)[name], undefined);
  }
});

it('Ghost table', () => {
  class GhostTA extends mm.TableActions {
    t = new MyInsertAction().from(post).setInputs();
  }
  const ta = mm.tableActions(mm.ghostTable, GhostTA);
  const v = ta.t;
  ok(mm.ghostTable instanceof mm.GhostTable);
  eq(v.groupTable, mm.ghostTable);
});
