import * as assert from 'assert';
import { itThrows } from 'it-throws';
import * as mm from '../..';
import user from '../models/user';
import post from '../models/post';

const expect = assert.equal;

it('ta', () => {
  class UserTA extends mm.TableActions {
    sel = mm.select(user.id);
    upd = mm
      .unsafeUpdateAll()
      .set(user.name, mm.sql`${mm.input(user.name)}`)
      .set(user.follower_count, mm.sql`${user.follower_count} + 1`);
  }
  const ta = mm.tableActions(user, UserTA);

  assert.ok(ta instanceof mm.TableActions);
  expect(ta.__table, user);

  const v1 = ta.upd;
  expect(v1.__name, 'upd');
  expect(v1.__table, user);
  assert.ok(v1 instanceof mm.UpdateAction);

  const v2 = ta.sel;
  expect(v2.__name, 'sel');
  expect(v2.__table, user);
  assert.ok(v2 instanceof mm.SelectAction);
});

it('Register property callback', () => {
  let counter = 0;
  const cb = () => counter++;
  const action = new mm.Action(mm.ActionType.select);
  // Register the callback twice
  mm.CoreProperty.registerHandler(action, cb);
  mm.CoreProperty.registerHandler(action, cb);
  class UserTA extends mm.TableActions {
    t = action;
  }

  assert.deepEqual(action.__handlers, [cb, cb]);
  expect(counter, 0);
  mm.tableActions(user, UserTA);
  expect(action.__handlers, null);
  expect(counter, 2);
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
    new mm.SQLVariable('int', 'id'),
    new mm.SQLVariable('int', 'id2'),
  ];
  class UserTA extends mm.TableActions {
    t = mm.select(user.id).argStubs(...stubs);
  }
  const ta = mm.tableActions(user, UserTA);

  const v = ta.t;
  assert.deepEqual(v.__argStubs, stubs);
});

it('action.ensureInitialized', () => {
  class UserTA extends mm.TableActions {
    t = mm.select(user.id);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  assert.deepEqual(v.ensureInitialized(), [user, 't']);
  itThrows(
    () => mm.select(user.id).ensureInitialized(),
    'Action "SelectAction" is not initialized',
  );
});

class MyInsertAction extends mm.InsertAction {
  vTable: mm.Table | null = null;
  vName: string | null = null;

  constructor() {
    super(true);
  }

  validate(table: mm.Table, name: string) {
    super.validate(table, name);
    this.vTable = table;
    this.vName = name;
  }
}

it('Action.validate', () => {
  class UserTA extends mm.TableActions {
    t = new MyInsertAction().setInputs();
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  expect(v.vTable, user);
  expect(v.vName, 't');
});

it('Action.validate (from)', () => {
  class UserTA extends mm.TableActions {
    t = new MyInsertAction().from(post).setInputs();
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  expect(v.vTable, post);
  expect(v.vName, 't');
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

  expect(ta.__table, user);
  expect(ta instanceof mm.TableActions, true);
  assert.deepEqual(ta.__actions, {
    upd: ta.upd,
    sel: ta.sel,
  });
  for (const [name, action] of Object.entries(ta.__actions)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((ta as any)[name], action);
  }
});

it('__actions and props (taCore)', () => {
  const sel = mm.select();
  const del = mm.deleteOne().byID();
  const actions: Record<string, mm.Action> = {
    del,
    sel,
  };
  const ta = mm.tableActionsCore(user, null, actions);

  expect(ta.__table, user);
  expect(ta instanceof mm.TableActions, true);
  assert.deepEqual(ta.__actions, actions);
  for (const [name, action] of Object.entries(ta.__actions)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((ta as any)[name], action);
  }
});
