import * as mm from '../../';
import user from '../models/user';
import * as assert from 'assert';
import { itThrows } from 'it-throws';

const expect = assert.equal;
const ok = assert.ok;

it('ta', () => {
  class UserTA extends mm.TableActions {
    upd = mm
      .unsafeUpdateAll()
      .set(user.name, mm.sql`${mm.input(user.name)}`)
      .set(user.follower_count, mm.sql`${user.follower_count} + 1`);
    sel = mm.select(user.id);
  }
  const ta = mm.ta(user, UserTA);

  ok(ta instanceof mm.TableActions);
  expect(ta.__table, user);

  const v1 = ta.upd;
  expect(v1.__name, 'upd');
  expect(v1.__table, user);
  ok(v1 instanceof mm.UpdateAction);

  const v2 = ta.sel;
  expect(v2.__name, 'sel');
  expect(v2.__table, user);
  ok(v2 instanceof mm.SelectAction);
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
  mm.ta(user, UserTA);
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
  const ta = mm.ta(user, UserTA);

  const actions: mm.Action[] = [];
  mm.enumerateActions(ta, a => actions.push(a));
  assert.deepEqual(actions, [ta.upd, ta.sel]);
});

it('enumerateActions (sorted)', () => {
  class UserTA extends mm.TableActions {
    upd = mm
      .unsafeUpdateAll()
      .set(user.name, mm.sql`${mm.input(user.name)}`)
      .set(user.follower_count, mm.sql`${user.follower_count} + 1`);
    sel = mm.select(user.id);
  }
  const ta = mm.ta(user, UserTA);

  const actions: mm.Action[] = [];
  mm.enumerateActions(ta, a => actions.push(a), { sorted: true });
  assert.deepEqual(actions, [ta.sel, ta.upd]);
});

it('Argument stubs', () => {
  const stubs = [
    new mm.SQLVariable('int', 'id'),
    new mm.SQLVariable('int', 'id2'),
  ];
  class UserTA extends mm.TableActions {
    t = mm.select(user.id).argStubs(...stubs);
  }
  const ta = mm.ta(user, UserTA);

  const v = ta.t;
  assert.deepEqual(v.__argStubs, stubs);
});

it('action.ensureInitialized', () => {
  class UserTA extends mm.TableActions {
    t = mm.select(user.id);
  }
  const ta = mm.ta(user, UserTA);
  const v = ta.t;
  assert.deepEqual(v.ensureInitialized(), [user, 't']);
  itThrows(
    () => mm.select(user.id).ensureInitialized(),
    'Action "SelectAction" is not initialized',
  );
});

it('action.saveReturnValue', () => {
  class UserTA extends mm.TableActions {
    t = mm
      .select(user.id)
      .saveReturnValue('a', '1')
      .saveDefaultReturnValue('2');
  }
  const ta = mm.ta(user, UserTA);
  const v = ta.t;
  assert.deepEqual(v.__returnMap, { default: '2', a: '1' });
});
