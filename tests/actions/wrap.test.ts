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

// test('Throws on undefined input', () => {
//   class UserTA extends dd.TA {
//     t = dd
//       .select(user.id, user.name)
//       .where(
//         dd.sql`${user.id.toInput()} ${user.name.toInput()} ${user.id.toInput()}`,
//       );
//     t2 = this.t.wrap({
//       haha: `"tony"`,
//     });
//   }
//   expect(() => dd.ta(user, UserTA)).toThrow('haha');
// });

// test('getInputs', () => {
//   class UserTA extends dd.TA {
//     t = dd
//       .select(user.id, user.name)
//       .where(
//         dd.sql`${user.id.toInput()} ${user.name.toInput()} ${user.id.toInput()}`,
//       );
//     t2 = this.t.wrap({
//       name: `"tony"`,
//     });
//   }
//   const ta = dd.ta(user, UserTA);
//   const v = ta.t2;
//   expect(v.getInputs().list).toEqual([user.id.toInput()]);
// });
