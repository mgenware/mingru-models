import * as dd from '../../';
import user from '../models/user';
import * as assert from 'assert';

const expect = assert.equal;
const ok = assert.ok;

it('ta', () => {
  class UserTA extends dd.TA {
    upd = dd
      .unsafeUpdateAll()
      .set(user.name, dd.sql`${dd.input(user.name)}`)
      .set(user.follower_count, dd.sql`${user.follower_count} + 1`);
    sel = dd.select(user.id);
  }
  const ta = dd.ta(user, UserTA);

  ok(ta instanceof dd.TA);
  expect(ta.__table, user);

  const v1 = ta.upd;
  expect(v1.__name, 'upd');
  expect(v1.__table, user);
  ok(v1 instanceof dd.UpdateAction);

  const v2 = ta.sel;
  expect(v2.__name, 'sel');
  expect(v2.__table, user);
  ok(v2 instanceof dd.SelectAction);
});

it('Register property callback', () => {
  let counter = 0;
  const cb = () => counter++;
  const action = new dd.Action(dd.ActionType.select);
  // Register the callback twice
  dd.CoreProperty.registerHandler(action, cb);
  dd.CoreProperty.registerHandler(action, cb);
  class UserTA extends dd.TA {
    t = action;
  }

  expect(action.__handlers!.length, 2);
  expect(counter, 0);
  dd.ta(user, UserTA);
  expect(action.__handlers, null);
  expect(counter, 2);
});

it('enumerateActions', () => {
  class UserTA extends dd.TA {
    upd = dd
      .unsafeUpdateAll()
      .set(user.name, dd.sql`${dd.input(user.name)}`)
      .set(user.follower_count, dd.sql`${user.follower_count} + 1`);
    sel = dd.select(user.id);
  }
  const ta = dd.ta(user, UserTA);

  const actions: dd.Action[] = [];
  dd.enumerateActions(ta, a => actions.push(a));
  assert.deepEqual(actions, [ta.upd, ta.sel]);
});

it('enumerateActions (sorted)', () => {
  class UserTA extends dd.TA {
    upd = dd
      .unsafeUpdateAll()
      .set(user.name, dd.sql`${dd.input(user.name)}`)
      .set(user.follower_count, dd.sql`${user.follower_count} + 1`);
    sel = dd.select(user.id);
  }
  const ta = dd.ta(user, UserTA);

  const actions: dd.Action[] = [];
  dd.enumerateActions(ta, a => actions.push(a), { sorted: true });
  assert.deepEqual(actions, [ta.sel, ta.upd]);
});

it('Argument stubs', () => {
  const stubs = [
    new dd.SQLVariable('int', 'id'),
    new dd.SQLVariable('int', 'id2'),
  ];
  class UserTA extends dd.TA {
    t = dd.select(user.id).argStubs(...stubs);
  }
  const ta = dd.ta(user, UserTA);

  const v = ta.t;
  assert.deepEqual(v.__argStubs, stubs);
});

it('action.ensureInitialized', () => {
  class UserTA extends dd.TA {
    t = dd.select(user.id);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  assert.doesNotThrow(() => v.ensureInitialized());
  assert.throws(
    () => dd.select(user.id).ensureInitialized(),
    'not initialized',
  );
});
