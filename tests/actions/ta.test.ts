import * as dd from '../../';
import user from '../models/user';

it('ta', () => {
  class UserTA extends dd.TA {
    upd = dd
      .unsafeUpdateAll()
      .set(user.name, dd.sql`${dd.input(user.name)}`)
      .set(user.follower_count, dd.sql`${user.follower_count} + 1`);
    sel = dd.select(user.id);
  }
  const ta = dd.ta(user, UserTA);

  expect(ta).toBeInstanceOf(dd.TA);
  expect(ta.__table).toBe(user);

  const v1 = ta.upd;
  expect(v1.__name).toBe('upd');
  expect(v1.__table).toBe(user);
  expect(v1).toBeInstanceOf(dd.UpdateAction);

  const v2 = ta.sel;
  expect(v2.__name).toBe('sel');
  expect(v2.__table).toBe(user);
  expect(v2).toBeInstanceOf(dd.SelectAction);
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

  expect(action.__handlers!.length).toBe(2);
  expect(counter).toBe(0);
  dd.ta(user, UserTA);
  expect(action.__handlers).toBe(null);
  expect(counter).toBe(2);
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
  expect(actions).toEqual([ta.upd, ta.sel]);
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
  expect(actions).toEqual([ta.sel, ta.upd]);
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
  expect(v.__argStubs).toEqual(stubs);
});
