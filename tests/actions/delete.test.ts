import * as dd from '../../';
import user from '../models/user';
import * as assert from 'assert';

const expect = assert.equal;
const ok = assert.ok;

it('DeleteAction', () => {
  class UserTA extends dd.TableActions {
    t = dd.deleteOne().where(dd.sql`${user.id} = 1`);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  ok(v instanceof dd.DeleteAction);
  ok(v instanceof dd.CoreSelectAction);
  ok(v instanceof dd.Action);
  expect(
    v.whereSQL,
    'SQL(E(Column(id, Table(user)), type = 1), E( = 1, type = 0))',
  );
  expect(v.actionType, dd.ActionType.delete);
});

it('deleteOne', () => {
  class UserTA extends dd.TableActions {
    t = dd.deleteOne().where(dd.sql`${user.id} = 1`);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  // extra props
  expect(v.ensureOneRowAffected, true);
  expect(v.allowNoWhere, false);

  // Throw error when WHERE is empty
  assert.throws(() => {
    class TA extends dd.TableActions {
      t = dd.deleteOne();
    }
    dd.ta(user, TA);
  }, 'unsafeDeleteAll');
});

it('deleteSome', () => {
  class UserTA extends dd.TableActions {
    t = dd.deleteSome().where(dd.sql`${user.id} = 1`);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  // extra props
  expect(v.ensureOneRowAffected, false);
  expect(v.allowNoWhere, false);

  // Throw error when WHERE is empty
  assert.throws(() => {
    class TA extends dd.TableActions {
      t = dd.deleteSome();
    }
    dd.ta(user, TA);
  }, 'unsafeDeleteAll');
});

it('unsafeDeleteAll', () => {
  class UserTA extends dd.TableActions {
    t = dd.unsafeDeleteAll();
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  // extra props
  expect(v.ensureOneRowAffected, false);
  expect(v.allowNoWhere, true);
});
