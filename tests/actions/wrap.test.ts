import * as dd from '../../';
import user from '../models/user';

test('WrappedAction', () => {
  class UserTA extends dd.TA {
    t = dd.deleteOne().byID();
    t2 = this.t.wrap({
      id: '1',
    });
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t2;
  expect(v).toBeInstanceOf(dd.WrappedAction);
  expect(v).toBeInstanceOf(dd.Action);
  expect(v.actionType).toBe(dd.ActionType.wrap);
  expect(v.action).toBe(ta.t);
  expect(v.args).toEqual({
    id: '1',
  });
});

test('Chaining', () => {
  class UserTA extends dd.TA {
    t = dd.insert().setInputs();
    t2 = this.t
      .wrap({
        name: 'a',
        def_value: 'b',
      })
      .wrap({
        def_value: 'c',
        follower_count: 123,
      });
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t2;
  expect(v.args).toEqual({
    name: 'a',
    def_value: 'c',
    follower_count: 123,
  });
});

test('Uninitialized wrapped action __table n __name', () => {
  class UserTA extends dd.TA {
    t = dd
      .deleteOne()
      .byID()
      .wrap({ id: 23 });
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  expect(v.__table).toBe(user);
  expect(v.__name).toBe('t');
});
