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