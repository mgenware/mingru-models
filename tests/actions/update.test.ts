/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as assert from 'assert';
import { itThrows } from 'it-throws';
import * as mm from '../../dist/main.js';
import user from '../models/user.js';
import { eq, ok, deepEq } from '../assert-aliases.js';

it('Update', () => {
  class UserTA extends mm.TableActions {
    t = mm
      .updateSome()
      .set(user.name, mm.sql`${mm.input(user.name)}`)
      .set(user.follower_count, mm.sql`${user.follower_count} + 1`)
      .whereSQL(mm.sql`${user.id} = 1`);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  const vd = v.__getData();

  eq(vd.actionType, mm.ActionType.update);
  ok(v instanceof mm.UpdateAction);
  ok(v instanceof mm.CoreUpdateAction);
  ok(v instanceof mm.Action);
  eq(v.__whereSQLString, 'SQL(E(Column(id, Table(user)), type = 1), E( = 1, type = 0))');
  eq(vd.setters?.size, 2);
  eq(v.toString(), 'UpdateAction(t, Table(user))');

  // extra props
  eq(vd.ensureOneRowAffected, false);
  eq(vd.unsafeMode, false);
  eq(
    v.__settersToString(),
    'name: SQL(E(SQLVar(undefined, desc = Column(name, Table(user))), type = 2)), follower_count: SQL(E(Column(follower_count, Table(user)), type = 1), E( + 1, type = 0))',
  );
});

it('Order of setInputs and set', () => {
  class UserTA extends mm.TableActions {
    t = mm.unsafeUpdateAll().setInputs(user.snake_case_name).set(user.name, user.name.toInput('b'));
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;

  eq(
    v.__settersToString(),
    'snake_case_name: SQL(E(SQLVar(undefined, desc = Column(snake_case_name, Table(user))), type = 2)), name: SQL(E(SQLVar(b, desc = Column(name, Table(user))), type = 2))',
  );
});

it('setInputs and setDefaults', () => {
  class UserTA extends mm.TableActions {
    t = mm.unsafeUpdateAll().setDefaults(user.def_value).setInputs(user.snake_case_name);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;

  eq(
    v.__settersToString(),
    'def_value: abc, snake_case_name: SQL(E(SQLVar(undefined, desc = Column(snake_case_name, Table(user))), type = 2))',
  );
});

it('setInputs with no args', () => {
  class UserTA extends mm.TableActions {
    t = mm
      .unsafeUpdateAll()
      .setDefaults(user.def_value)
      .setInputs(user.snake_case_name)
      .setInputs();
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;

  eq(
    v.__settersToString(),
    'def_value: abc, snake_case_name: SQL(E(SQLVar(undefined, desc = Column(snake_case_name, Table(user))), type = 2))',
  );
  deepEq([...v.__getData().autoSetters!], [mm.AutoSetterType.input]);
});

it('setDefaults with no args', () => {
  class UserTA extends mm.TableActions {
    t = mm
      .unsafeUpdateAll()
      .setDefaults(user.def_value)
      .setInputs(user.snake_case_name)
      .setDefaults();
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;

  eq(
    v.__settersToString(),
    'def_value: abc, snake_case_name: SQL(E(SQLVar(undefined, desc = Column(snake_case_name, Table(user))), type = 2))',
  );
  deepEq([...v.__getData().autoSetters!], [mm.AutoSetterType.default]);
});

it('setInputs and setDefaults twice', () => {
  {
    class UserTA extends mm.TableActions {
      t = mm.unsafeUpdateAll().setInputs().setDefaults();
    }
    mm.tableActions(user, UserTA);

    const ta = mm.tableActions(user, UserTA);
    const v = ta.t;

    deepEq([...v.__getData().autoSetters!], [mm.AutoSetterType.input, mm.AutoSetterType.default]);
  }
  {
    class UserTA extends mm.TableActions {
      t = mm.unsafeUpdateAll().setDefaults().setInputs();
    }
    mm.tableActions(user, UserTA);

    const ta = mm.tableActions(user, UserTA);
    const v = ta.t;

    deepEq([...v.__getData().autoSetters!], [mm.AutoSetterType.default, mm.AutoSetterType.input]);
  }
});

it('Set same column twice', () => {
  class UserTA extends mm.TableActions {
    t = mm
      .unsafeUpdateAll()
      .set(user.name, user.name.toInput('a'))
      .setInputs(user.snake_case_name, user.name)
      .set(user.name, user.name.toInput('b'));
  }
  itThrows(
    () => mm.tableActions(user, UserTA),
    'Column "Column(name, Table(user))" is already set [table "Table(user)"]',
  );
});

it('updateOne', () => {
  class UserTA extends mm.TableActions {
    t = mm.updateOne().setInputs(user.snake_case_name).by(user.id);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  const vd = v.__getData();

  // extra props
  eq(vd.ensureOneRowAffected, true);
  eq(vd.unsafeMode, false);

  itThrows(() => {
    class TA extends mm.TableActions {
      t = mm.updateOne().setInputs(user.snake_case_name);
    }
    mm.tableActions(user, TA);
  }, '`unsafeMode` is not on, you must define a WHERE clause. Otherwise, use `unsafeUpdateAll` [action "t"] [table "Table(user)"]');
});

it('updateSome', () => {
  class UserTA extends mm.TableActions {
    t = mm.updateSome().setInputs(user.snake_case_name).by(user.id);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  const vd = v.__getData();

  // extra props
  eq(vd.ensureOneRowAffected, false);
  eq(vd.unsafeMode, false);

  itThrows(() => {
    class TA extends mm.TableActions {
      t = mm.updateSome().setInputs(user.snake_case_name);
    }
    mm.tableActions(user, TA);
  }, '`unsafeMode` is not on, you must define a WHERE clause. Otherwise, use `unsafeUpdateAll` [action "t"] [table "Table(user)"]');
});

it('unsafeUpdateAll', () => {
  class UserTA extends mm.TableActions {
    t = mm.unsafeUpdateAll().setInputs(user.snake_case_name);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  const vd = v.__getData();

  // extra props
  eq(vd.ensureOneRowAffected, false);
  eq(vd.unsafeMode, true);
});

it('ByID', () => {
  class UserTA extends mm.TableActions {
    t = mm.updateOne().setInputs(user.snake_case_name).by(user.id);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;

  eq(
    v.__whereSQLString,
    'SQL(E(Column(id, Table(user)), type = 1), E( = , type = 0), E(SQLVar(undefined, desc = Column(id, Table(user))), type = 2))',
  );
});

it('SQLConvertible value', () => {
  class UserTA extends mm.TableActions {
    t = mm.updateOne().set(user.name, mm.localDateNow()).by(user.id);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  const vd = v.__getData();

  eq(`${vd.setters?.get(user.name)}`, 'SQL(E(SQLCall(1, return = ColType(SQL.DATE), type = 3))');
});

it('No setters', () => {
  itThrows(() => {
    class UserTA extends mm.TableActions {
      t = mm.unsafeUpdateAll();
    }
    mm.tableActions(user, UserTA);
  }, 'No setters [action "t"] [table "Table(user)"]');
  assert.doesNotThrow(() => {
    class UserTA extends mm.TableActions {
      t = mm.unsafeUpdateAll().setInputs();
    }
    mm.tableActions(user, UserTA);
  });
  assert.doesNotThrow(() => {
    class UserTA extends mm.TableActions {
      t = mm.unsafeUpdateAll().setDefaults();
    }
    mm.tableActions(user, UserTA);
  });
});

it('by', () => {
  class UserTA extends mm.TableActions {
    t = mm.updateOne().setInputs(user.def_value).by(user.snake_case_name);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  eq(
    v.__whereSQLString,
    'SQL(E(Column(snake_case_name, Table(user)), type = 1), E( = , type = 0), E(SQLVar(undefined, desc = Column(snake_case_name, Table(user))), type = 2))',
  );
});

it('andBy', () => {
  class UserTA extends mm.TableActions {
    t1 = mm.updateOne().setInputs(user.name).by(user.snake_case_name).andBy(user.follower_count);

    t2 = mm.updateOne().setInputs(user.name).andBy(user.follower_count);
    t3 = mm.updateOne().setInputs(user.name).by(user.id).andBy(user.follower_count);
  }
  const ta = mm.tableActions(user, UserTA);
  eq(
    ta.t1.__whereSQLString,
    'SQL(E((, type = 0), E(Column(snake_case_name, Table(user)), type = 1), E( = , type = 0), E(SQLVar(undefined, desc = Column(snake_case_name, Table(user))), type = 2), E( AND , type = 0), E(SQLVar(undefined, desc = Column(follower_count, Table(user))), type = 2), E(), type = 0))',
  );
  eq(
    ta.t2.__whereSQLString,
    'SQL(E(SQLVar(undefined, desc = Column(follower_count, Table(user))), type = 2))',
  );
  eq(
    ta.t3.__whereSQLString,
    'SQL(E((, type = 0), E(Column(id, Table(user)), type = 1), E( = , type = 0), E(SQLVar(undefined, desc = Column(id, Table(user))), type = 2), E( AND , type = 0), E(SQLVar(undefined, desc = Column(follower_count, Table(user))), type = 2), E(), type = 0))',
  );
});

it('where and whereSQL', () => {
  class UserTA extends mm.TableActions {
    t1 = mm
      .updateOne()
      .set(user.name, user.name.toInput())
      .whereSQL(mm.sql`${user.id} = 1`);

    t2 = mm.updateOne().set(user.name, user.name.toInput()).where`${user.id} = 1`;
  }
  const ta = mm.tableActions(user, UserTA);
  eq(ta.t1.__whereSQLString, 'SQL(E(Column(id, Table(user)), type = 1), E( = 1, type = 0))');
  eq(ta.t2.__whereSQLString, 'SQL(E(Column(id, Table(user)), type = 1), E( = 1, type = 0))');
});

it('addAssign', () => {
  class UserTA extends mm.TableActions {
    t = mm
      .updateOne()
      .addAssign(user.follower_count, mm.sql`1`)
      .by(user.id);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;

  eq(
    v.__settersToString(),
    'follower_count: SQL(E(Column(follower_count, Table(user)), type = 1), E( + , type = 0), E(1, type = 0))',
  );
});

it('subAssign', () => {
  class UserTA extends mm.TableActions {
    t = mm
      .updateOne()
      .subAssign(user.follower_count, mm.sql`1`)
      .by(user.id);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;

  eq(
    v.__settersToString(),
    'follower_count: SQL(E(Column(follower_count, Table(user)), type = 1), E( - , type = 0), E(1, type = 0))',
  );
});
