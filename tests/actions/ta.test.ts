import * as assert from 'assert';
import * as mm from '../..';
import user from '../models/user';
import post from '../models/post';

const eq = assert.equal;

it('Core props', () => {
  class UserTA extends mm.TableActions {
    t = mm.select(user.id);
    t2 = mm.select(post.id).from(post);
  }
  const ta = mm.tableActions(user, UserTA);
  let v = ta.t;
  assert.strictEqual(v.__name, 't');
  assert.strictEqual(v.__groupTable, user);
  assert.strictEqual(v.__sqlTable, null);
  assert.strictEqual(v.mustGetGroupTable(), user);
  assert.strictEqual(v.mustGetAvailableSQLTable(user), user);
  assert.strictEqual(v.mustGetName(), 't');

  v = ta.t2;
  assert.strictEqual(v.__name, 't2');
  assert.strictEqual(v.__groupTable, user);
  assert.strictEqual(v.__sqlTable, post);
  assert.strictEqual(v.mustGetGroupTable(), user);
  assert.strictEqual(v.mustGetAvailableSQLTable(user), post);
  assert.strictEqual(v.mustGetName(), 't2');
});

it('enumerateActions', () => {
  class UserTA extends mm.TableActions {
    upd = mm
      .unsafeUpdateAll()
      .set(user.name, mm.sql`${mm.input(user.name)}`)
      .set(user.follower_count, mm.sql`${user.follower_count} + 1`);

    sel = mm.select(user.id);
  }
  const ta = mm.tableActions(user, UserTA);
  assert.deepEqual(ta.__actions, {
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
    t = mm.select(user.id).argStubs(...stubs);
  }
  const ta = mm.tableActions(user, UserTA);

  const v = ta.t;
  assert.deepEqual(v.__argStubs, stubs);
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
      t = mm.select(
        mm
          .sel(mm.sql`1`, 'col')
          .attrs({ a: true })
          .attr('c', 4)
          .attrs({ b: 's' }),
      );
    }
    const table = mm.tableActions(user, UserTA);
    const t = table.t as mm.SelectAction;
    assert.deepEqual((t.columns[0] as mm.RawColumn).__attrs, {
      a: true,
      b: 's',
      c: 4,
    });
  }
  {
    class UserTA extends mm.TableActions {
      t = mm.select(
        mm
          .sel(mm.sql`1`, 'col')
          .attr('a', true)
          .attrs({ c: 4 })
          .attrs({ b: 's', c: 5 }),
      );
    }
    const table = mm.tableActions(user, UserTA);
    const t = table.t as mm.SelectAction;
    assert.deepEqual((t.columns[0] as mm.RawColumn).__attrs, {
      a: true,
      b: 's',
      c: 5,
    });
  }
});

it('__actions and props', () => {
  class UserTA extends mm.TableActions {
    upd = mm
      .unsafeUpdateAll()
      .set(user.name, mm.sql`${mm.input(user.name)}`)
      .set(user.follower_count, mm.sql`${user.follower_count} + 1`);

    sel = mm.select(user.id);
  }
  const ta = mm.tableActions(user, UserTA);

  eq(ta.__table, user);
  eq(ta instanceof mm.TableActions, true);
  assert.deepEqual(ta.__actions, {
    upd: ta.upd,
    sel: ta.sel,
  });
  for (const [name, action] of Object.entries(ta.__actions)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eq((ta as any)[name], action);
  }
});

it('__actions and props (taCore)', () => {
  const sel = mm.select();
  const del = mm.deleteOne().by(user.id);
  const actions: Record<string, mm.Action> = {
    del,
    sel,
  };
  const ta = mm.tableActionsCore(user, null, actions);

  eq(ta.__table, user);
  eq(ta instanceof mm.TableActions, true);
  assert.deepEqual(ta.__actions, actions);
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
  assert.ok(mm.ghostTable instanceof mm.GhostTable);
  eq(v.groupTable, mm.ghostTable);
});
