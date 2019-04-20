import * as dd from '../../';
import user from '../models/user';

test('DeleteAction', () => {
  class UserTA extends dd.TA {
    t = dd.deleteOne().where(dd.sql`${user.id} = 1`);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  expect(v).toBeInstanceOf(dd.DeleteAction);
  expect(v).toBeInstanceOf(dd.Action);
  expect(v.whereSQL!.toString()).toBe('`id` = 1');
  expect(v.actionType).toBe(dd.ActionType.delete);
});

test('DeleteOne', () => {
  class UserTA extends dd.TA {
    t = dd.deleteOne().where(dd.sql`${user.id} = 1`);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  // extra props
  expect(v.checkAffectedRows).toBe(true);
  expect(v.deleteAll).toBe(false);
});

test('DeleteAll', () => {
  class UserTA extends dd.TA {
    t = dd.deleteAll();
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  // extra props
  expect(v.checkAffectedRows).toBe(false);
  expect(v.deleteAll).toBe(true);
});

test('DeleteAll and where', () => {
  expect(() => {
    class UserTA extends dd.TA {
      t = dd.deleteAll();
    }
    dd.ta(user, UserTA);
  }).not.toThrow();
});
