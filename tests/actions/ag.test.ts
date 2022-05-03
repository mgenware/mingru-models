import * as mm from '../../dist/main.js';
import user from '../models/user.js';
import post from '../models/post.js';
import { eq, ok, deepEq } from '../assert-aliases.js';

it('Core props', () => {
  class UserTA extends mm.ActionGroup {
    t = mm.selectRow(user.id);
    t2 = mm.selectRow(post.id).from(post);
  }
  const ta = mm.actionGroup(user, UserTA);
  const tad = ta.__getData();
  eq(tad.name, 'UserTA');
  eq(tad.groupTable, user);

  let v = ta.t;
  let vd = v.__getData();
  eq(vd.name, 't');
  eq(vd.actionGroup, ta);
  eq(vd.sqlTable, undefined);
  eq(vd.inline, false);
  eq(v.__mustGetGroupTable(), user);
  eq(v.__mustGetName(), 't');

  v = ta.t2;
  vd = v.__getData();
  eq(vd.name, 't2');
  eq(vd.actionGroup, ta);
  eq(vd.sqlTable, post);
  eq(v.__mustGetGroupTable(), user);
  eq(v.__mustGetName(), 't2');
});

it('enumerateActions', () => {
  class UserTA extends mm.ActionGroup {
    upd = mm
      .unsafeUpdateAll()
      .set(user.name, mm.sql`${mm.param(user.name)}`)
      .set(user.follower_count, mm.sql`${user.follower_count} + 1`);

    sel = mm.selectRow(user.id);
    nonAction = 10;
    emptyAction = mm.emptyAction;
  }
  const ta = mm.actionGroup(user, UserTA);
  deepEq(ta.__getData().actions, {
    upd: ta.upd,
    sel: ta.sel,
  });
});

it('Argument stubs', () => {
  const stubs = [
    new mm.SQLVariable({ type: 'int', defaultValue: 0 }, 'id'),
    new mm.SQLVariable({ type: 'int', defaultValue: 0 }, 'id2'),
  ];
  class UserTA extends mm.ActionGroup {
    t = mm.selectRow(user.id).argStubs(...stubs);
  }
  const ta = mm.actionGroup(user, UserTA);

  const v = ta.t;
  const vd = v.__getData();
  deepEq(vd.argStubs, stubs);
});

class MyInsertAction extends mm.InsertAction {
  groupTable: mm.Table | null = null;
  constructor() {
    super(true);
  }

  override __validate(groupTable: mm.Table) {
    super.__validate(groupTable);
    this.groupTable = groupTable;
  }
}

it('Action.attr/attrs', () => {
  {
    class UserTA extends mm.ActionGroup {
      t = mm
        .selectRow(mm.sel(mm.sql`1`, 'col'))
        .attr(1, true)
        .attr(3, 4)
        .attr(2, 's');
    }
    const table = mm.actionGroup(user, UserTA);
    deepEq(
      table.t.__getData().attrs,
      new Map<number, unknown>([
        [1, true],
        [2, 's'],
        [3, 4],
      ]),
    );
  }
  {
    class UserTA extends mm.ActionGroup {
      t = mm
        .selectRow(mm.sel(mm.sql`1`, 'col'))
        .attr(1, true)
        .attr(2, 4)
        .attr(1, 's')
        .attr(3, 5);
    }
    const table = mm.actionGroup(user, UserTA);
    deepEq(
      table.t.__getData().attrs,
      new Map<number, unknown>([
        [1, 's'],
        [2, 4],
        [3, 5],
      ]),
    );
  }
});

it('Action.privateAttr', () => {
  class UserTA extends mm.ActionGroup {
    t = mm
      .selectRow(mm.sel(mm.sql`1`, 'col'))
      .attr(1, true)
      .attr(3, 4)
      .attr(2, 's')
      .privateAttr();
  }
  const table = mm.actionGroup(user, UserTA);
  deepEq(
    table.t.__getData().attrs,
    new Map<number, unknown>([
      [1, true],
      [2, 's'],
      [3, 4],
      [mm.ActionAttribute.isPrivate, true],
    ]),
  );
});

it('Action.resultTypeNameAttr', () => {
  class UserTA extends mm.ActionGroup {
    t = mm
      .selectRow(mm.sel(mm.sql`1`, 'col'))
      .attr(1, true)
      .attr(3, 4)
      .attr(2, 's')
      .privateAttr()
      .resultTypeNameAttr('aaa');
  }
  const table = mm.actionGroup(user, UserTA);
  deepEq(
    table.t.__getData().attrs,
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
  class UserTA extends mm.ActionGroup {
    upd = mm
      .unsafeUpdateAll()
      .set(user.name, mm.sql`${mm.param(user.name)}`)
      .set(user.follower_count, mm.sql`${user.follower_count} + 1`);

    sel = mm.selectRow(user.id);
  }
  const ta = mm.actionGroup(user, UserTA);
  const tad = ta.__getData();

  eq(tad.groupTable, user);
  eq(ta instanceof mm.ActionGroup, true);
  deepEq(tad.actions, {
    upd: ta.upd,
    sel: ta.sel,
  });
  for (const [name, action] of Object.entries(tad.actions)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eq((ta as any)[name], action);
  }
});

it('actionGroupCore', () => {
  const sel = mm.selectRow();
  const del = mm.deleteOne().by(user.id);
  const actions: Record<string, mm.Action | undefined> = {
    del,
    sel,
  };
  const ta = mm.actionGroupCore(user, 'MyName', actions);
  const tad = ta.__getData();

  eq(tad.groupTable, user);
  eq(ta instanceof mm.ActionGroup, true);
  eq(tad.name, 'MyName');
  deepEq(tad.actions, actions);
  // `actionGroupCore` never add property into table actions.
  for (const [name] of Object.entries(tad.actions)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eq((ta as any)[name], undefined);
  }
});

it('Ghost table', () => {
  ok(mm.ghostTable instanceof mm.GhostTable);
});

it('`__validate` with `groupTable`', () => {
  class UserTA extends mm.ActionGroup {
    t = new MyInsertAction().setParams();
  }
  const ta = mm.actionGroup(user, UserTA);
  const v = ta.t;
  eq(v.groupTable, user);
});

it('`__validate` with `sqlTable`', () => {
  class GhostTA extends mm.ActionGroup {
    t = new MyInsertAction().from(post).setParams();
  }
  const ta = mm.actionGroup(mm.ghostTable, GhostTA);
  const v = ta.t;
  ok(mm.ghostTable instanceof mm.GhostTable);
  eq(v.groupTable, post);
});

it('Argument stubs', () => {
  const stubs = [
    new mm.SQLVariable({ type: 'int', defaultValue: 0 }, 'id'),
    new mm.SQLVariable({ type: 'int', defaultValue: 0 }, 'id2'),
  ];
  class UserTA extends mm.ActionGroup {
    t = mm.selectRow(user.id).argStubs(...stubs);
  }
  const ta = mm.actionGroup(user, UserTA);

  const v = ta.t;
  const vd = v.__getData();
  deepEq(vd.argStubs, stubs);
});
