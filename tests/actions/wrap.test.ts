import * as dd from '../../';
import user from '../models/user';
import * as assert from 'assert';

const expect = assert.equal;
const ok = assert.ok;

it('WrappedAction', () => {
  class UserTA extends dd.TableActions {
    t = dd.deleteOne().byID();
    t2 = this.t.wrap({
      id: '1',
    });
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t2;
  ok(v instanceof dd.WrappedAction);
  ok(v instanceof dd.Action);
  expect(v.actionType, dd.ActionType.wrap);
  expect(v.action, ta.t);
  assert.deepEqual(v.args, {
    id: '1',
  });
});

it('Chaining', () => {
  class UserTA extends dd.TableActions {
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
  assert.deepEqual(v.args, {
    name: 'a',
    def_value: 'c',
    follower_count: 123,
  });
  expect(v.isTemp, false);
});

it('Uninitialized wrapped action __table n __name', () => {
  class UserTA extends dd.TableActions {
    t = dd
      .deleteOne()
      .byID()
      .wrap({ id: 23 });
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  expect(v.__table, user);
  expect(v.__name, 't');
  expect(v.isTemp, true);
});
