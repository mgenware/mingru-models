import { itThrows } from 'it-throws';
import * as mm from '../..';
import user from '../models/user';
import { eq, ok } from '../assert-aliases';

it('DeleteAction', () => {
  class UserTA extends mm.TableActions {
    t = mm.deleteOne().whereSQL(mm.sql`${user.id} = 1`);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  ok(v instanceof mm.DeleteAction);
  ok(v instanceof mm.CoreSelectAction);
  ok(v instanceof mm.Action);
  eq(v.whereSQLString, 'SQL(E(Column(id, Table(user)), type = 1), E( = 1, type = 0))');
  eq(v.actionType, mm.ActionType.delete);
});

it('deleteOne', () => {
  class UserTA extends mm.TableActions {
    t = mm.deleteOne().whereSQL(mm.sql`${user.id} = 1`);
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
  }, '`allowNoWhere` is set to false, you must define a WHERE clause. Otherwise, use `unsafeDeleteAll` [action "t"] [table "Table(user)"]');
});

it('deleteSome', () => {
  class UserTA extends mm.TableActions {
    t = mm.deleteSome().whereSQL(mm.sql`${user.id} = 1`);
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
  }, '`allowNoWhere` is set to false, you must define a WHERE clause. Otherwise, use `unsafeDeleteAll` [action "t"] [table "Table(user)"]');
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

it('where and whereSQL', () => {
  class UserTA extends mm.TableActions {
    t1 = mm.deleteOne().whereSQL(mm.sql`${user.id} = 1`);

    t2 = mm.deleteOne().where`${user.id} = 1`;
  }
  const ta = mm.tableActions(user, UserTA);
  eq(ta.t1.whereSQLString, 'SQL(E(Column(id, Table(user)), type = 1), E( = 1, type = 0))');
  eq(ta.t2.whereSQLString, 'SQL(E(Column(id, Table(user)), type = 1), E( = 1, type = 0))');
});
