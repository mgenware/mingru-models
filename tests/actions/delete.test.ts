import * as assert from 'assert';
import { itThrows } from 'it-throws';
import * as mm from '../..';
import user from '../models/user';

const eq = assert.equal;

it('DeleteAction', () => {
  class UserTA extends mm.TableActions {
    t = mm.deleteOne().where(mm.sql`${user.id} = 1`);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  assert.ok(v instanceof mm.DeleteAction);
  assert.ok(v instanceof mm.CoreSelectAction);
  assert.ok(v instanceof mm.Action);
  eq(
    v.whereSQLString,
    'SQL(E(Column(id, Table(user)), type = 1), E( = 1, type = 0))',
  );
  eq(v.actionType, mm.ActionType.delete);
});

it('deleteOne', () => {
  class UserTA extends mm.TableActions {
    t = mm.deleteOne().where(mm.sql`${user.id} = 1`);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;

  // extra props
  eq(v.ensureOneRowAffected, true);
  eq(v.allowNoWhere, false);

  // Throw error when WHERE is empty
  itThrows(() => {
    class TA extends mm.TableActions {
      t = mm.deleteOne();
    }
    mm.tableActions(user, TA);
  }, '`allowNoWhere` is set to false, you must define a WHERE clause. Otherwise, use `unsafeDeleteAll` [action "t"]');
});

it('deleteSome', () => {
  class UserTA extends mm.TableActions {
    t = mm.deleteSome().where(mm.sql`${user.id} = 1`);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;

  // extra props
  eq(v.ensureOneRowAffected, false);
  eq(v.allowNoWhere, false);

  // Throw error when WHERE is empty
  itThrows(() => {
    class TA extends mm.TableActions {
      t = mm.deleteSome();
    }
    mm.tableActions(user, TA);
  }, '`allowNoWhere` is set to false, you must define a WHERE clause. Otherwise, use `unsafeDeleteAll` [action "t"]');
});

it('unsafeDeleteAll', () => {
  class UserTA extends mm.TableActions {
    t = mm.unsafeDeleteAll();
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;

  // extra props
  eq(v.ensureOneRowAffected, false);
  eq(v.allowNoWhere, true);
});
