import { itThrows } from 'it-throws';
import * as mm from '../../dist/main.js';
import user from '../models/user.js';
import { eq, ok } from '../assert-aliases.js';

it('DeleteAction', () => {
  class UserTA extends mm.TableActions {
    t = mm.deleteOne().whereSQL(mm.sql`${user.id} = 1`);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  const vd = v.__getData();

  ok(v instanceof mm.DeleteAction);
  ok(v instanceof mm.CoreSelectAction);
  ok(v instanceof mm.Action);
  eq(v.__whereSQLString, 'SQL(E(Column(id, Table(user)), type = 1), E( = 1, type = 0))');
  eq(vd.actionType, mm.ActionType.delete);
  eq(v.toString(), 'DeleteAction(t, Table(user))');
});

it('deleteOne', () => {
  class UserTA extends mm.TableActions {
    t = mm.deleteOne().whereSQL(mm.sql`${user.id} = 1`);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  const vd = v.__getData();

  // extra props
  eq(vd.ensureOneRowAffected, true);
  eq(vd.unsafeMode, false);

  // Throw error when WHERE is empty
  itThrows(() => {
    class TA extends mm.TableActions {
      t = mm.deleteOne();
    }
    mm.tableActions(user, TA);
  }, '`unsafeMode` is not on, you must define a WHERE clause. Otherwise, use `unsafeDeleteAll` [action "t"] [table "Table(user)"]');
});

it('deleteSome', () => {
  class UserTA extends mm.TableActions {
    t = mm.deleteSome().whereSQL(mm.sql`${user.id} = 1`);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  const vd = v.__getData();

  // extra props
  eq(vd.ensureOneRowAffected, false);
  eq(vd.unsafeMode, false);

  // Throw error when WHERE is empty
  itThrows(() => {
    class TA extends mm.TableActions {
      t = mm.deleteSome();
    }
    mm.tableActions(user, TA);
  }, '`unsafeMode` is not on, you must define a WHERE clause. Otherwise, use `unsafeDeleteAll` [action "t"] [table "Table(user)"]');
});

it('unsafeDeleteAll', () => {
  class UserTA extends mm.TableActions {
    t = mm.unsafeDeleteAll();
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  const vd = v.__getData();

  // extra props
  eq(vd.ensureOneRowAffected, false);
  eq(vd.unsafeMode, true);
});

it('where and whereSQL', () => {
  class UserTA extends mm.TableActions {
    t1 = mm.deleteOne().whereSQL(mm.sql`${user.id} = 1`);

    t2 = mm.deleteOne().where`${user.id} = 1`;
  }
  const ta = mm.tableActions(user, UserTA);
  eq(ta.t1.__whereSQLString, 'SQL(E(Column(id, Table(user)), type = 1), E( = 1, type = 0))');
  eq(ta.t2.__whereSQLString, 'SQL(E(Column(id, Table(user)), type = 1), E( = 1, type = 0))');
});
