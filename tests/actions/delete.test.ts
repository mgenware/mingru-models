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

test('deleteOne', () => {
  class UserTA extends dd.TA {
    t = dd.deleteOne().where(dd.sql`${user.id} = 1`);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  // extra props
  expect(v.checkAffectedRows).toBe(true);
  expect(v.allowNoWhere).toBe(false);

  // Throw error when WHERE is empty
  expect(() => {
    class TA extends dd.TA {
      t = dd.deleteOne();
    }
    dd.ta(user, TA);
  }).toThrow('unsafeDeleteAll');
});

test('deleteSome', () => {
  class UserTA extends dd.TA {
    t = dd.deleteSome().where(dd.sql`${user.id} = 1`);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  // extra props
  expect(v.checkAffectedRows).toBe(false);
  expect(v.allowNoWhere).toBe(false);

  // Throw error when WHERE is empty
  expect(() => {
    class TA extends dd.TA {
      t = dd.deleteSome();
    }
    dd.ta(user, TA);
  }).toThrow('unsafeDeleteAll');
});

test('unsafeDeleteAll', () => {
  class UserTA extends dd.TA {
    t = dd.unsafeDeleteAll();
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  // extra props
  expect(v.checkAffectedRows).toBe(false);
  expect(v.allowNoWhere).toBe(true);
});
