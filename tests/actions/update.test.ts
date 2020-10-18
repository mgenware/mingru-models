import * as assert from 'assert';
import { itThrows } from 'it-throws';
import * as mm from '../..';
import user from '../models/user';

const eq = assert.equal;

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

  eq(v.actionType, mm.ActionType.update);
  assert.ok(v instanceof mm.UpdateAction);
  assert.ok(v instanceof mm.CoreUpdateAction);
  assert.ok(v instanceof mm.Action);
  eq(v.whereSQLString, 'SQL(E(Column(id, Table(user)), type = 1), E( = 1, type = 0))');
  eq(v.setters.size, 2);

  // extra props
  eq(v.ensureOneRowAffected, false);
  eq(v.allowEmptyWhere, false);
  eq(
    v.settersToString(),
    'name: SQL(E(SQLVar(name, desc = Column(name, Table(user))), type = 2)), follower_count: SQL(E(Column(follower_count, Table(user)), type = 1), E( + 1, type = 0))',
  );
});

it('Order of setInputs and set', () => {
  class UserTA extends mm.TableActions {
    t = mm.unsafeUpdateAll().setInputs(user.snake_case_name).set(user.name, user.name.toInput('b'));
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;

  eq(
    v.settersToString(),
    'snake_case_name: SQL(E(SQLVar(snakeCaseName, desc = Column(snake_case_name, Table(user))), type = 2)), name: SQL(E(SQLVar(b, desc = Column(name, Table(user))), type = 2))',
  );
});

it('setInputs and setDefaults', () => {
  class UserTA extends mm.TableActions {
    t = mm.unsafeUpdateAll().setDefaults(user.def_value).setInputs(user.snake_case_name);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;

  eq(
    v.settersToString(),
    'def_value: abc, snake_case_name: SQL(E(SQLVar(snakeCaseName, desc = Column(snake_case_name, Table(user))), type = 2))',
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
    v.settersToString(),
    'def_value: abc, snake_case_name: SQL(E(SQLVar(snakeCaseName, desc = Column(snake_case_name, Table(user))), type = 2))',
  );
  assert.deepEqual([...v.autoSetters], [mm.AutoSetterType.input]);
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
    v.settersToString(),
    'def_value: abc, snake_case_name: SQL(E(SQLVar(snakeCaseName, desc = Column(snake_case_name, Table(user))), type = 2))',
  );
  assert.deepEqual([...v.autoSetters], [mm.AutoSetterType.default]);
});

it('setInputs and setDefaults twice', () => {
  {
    class UserTA extends mm.TableActions {
      t = mm.unsafeUpdateAll().setInputs().setDefaults();
    }
    mm.tableActions(user, UserTA);

    const ta = mm.tableActions(user, UserTA);
    const v = ta.t;

    assert.deepEqual([...v.autoSetters], [mm.AutoSetterType.input, mm.AutoSetterType.default]);
  }
  {
    class UserTA extends mm.TableActions {
      t = mm.unsafeUpdateAll().setDefaults().setInputs();
    }
    mm.tableActions(user, UserTA);

    const ta = mm.tableActions(user, UserTA);
    const v = ta.t;

    assert.deepEqual([...v.autoSetters], [mm.AutoSetterType.default, mm.AutoSetterType.input]);
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
    'Column "name" is already set [table "Table(user)"]',
  );
});

it('updateOne', () => {
  class UserTA extends mm.TableActions {
    t = mm.updateOne().setInputs(user.snake_case_name).by(user.id);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;

  // extra props
  eq(v.ensureOneRowAffected, true);
  eq(v.allowEmptyWhere, false);

  itThrows(() => {
    class TA extends mm.TableActions {
      t = mm.updateOne().setInputs(user.snake_case_name);
    }
    mm.tableActions(user, TA);
  }, '`allowNoWhere` is set to false, you must define a WHERE clause. Otherwise, use `unsafeUpdateAll` [action "t"] [table "Table(user)"]');
});

it('updateSome', () => {
  class UserTA extends mm.TableActions {
    t = mm.updateSome().setInputs(user.snake_case_name).by(user.id);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;

  // extra props
  eq(v.ensureOneRowAffected, false);
  eq(v.allowEmptyWhere, false);

  itThrows(() => {
    class TA extends mm.TableActions {
      t = mm.updateSome().setInputs(user.snake_case_name);
    }
    mm.tableActions(user, TA);
  }, '`allowNoWhere` is set to false, you must define a WHERE clause. Otherwise, use `unsafeUpdateAll` [action "t"] [table "Table(user)"]');
});

it('unsafeUpdateAll', () => {
  class UserTA extends mm.TableActions {
    t = mm.unsafeUpdateAll().setInputs(user.snake_case_name);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;

  // extra props
  eq(v.ensureOneRowAffected, false);
  eq(v.allowEmptyWhere, true);
});

it('ByID', () => {
  class UserTA extends mm.TableActions {
    t = mm.updateOne().setInputs(user.snake_case_name).by(user.id);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;

  eq(
    v.whereSQLString,
    'SQL(E(Column(id, Table(user)), type = 1), E( = , type = 0), E(SQLVar(id, desc = Column(id, Table(user))), type = 2))',
  );
});

it('SQLConvertible value', () => {
  class UserTA extends mm.TableActions {
    t = mm.updateOne().set(user.name, mm.localDateNow()).by(user.id);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;

  eq(v.setters.get(user.name), 'SQL(E(SQLCall(1, return = ColType(SQL.DATE), type = 3))');
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
    v.whereSQLString,
    'SQL(E(Column(snake_case_name, Table(user)), type = 1), E( = , type = 0), E(SQLVar(snakeCaseName, desc = Column(snake_case_name, Table(user))), type = 2))',
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
    ta.t1.whereSQLString,
    'SQL(E(Column(snake_case_name, Table(user)), type = 1), E( = , type = 0), E(SQLVar(snakeCaseName, desc = Column(snake_case_name, Table(user))), type = 2), E( AND , type = 0), E(SQLVar(followerCount, desc = Column(follower_count, Table(user))), type = 2))',
  );
  eq(
    ta.t2.whereSQLString,
    'SQL(E(SQLVar(followerCount, desc = Column(follower_count, Table(user))), type = 2))',
  );
  eq(
    ta.t3.whereSQLString,
    'SQL(E(Column(id, Table(user)), type = 1), E( = , type = 0), E(SQLVar(id, desc = Column(id, Table(user))), type = 2), E( AND , type = 0), E(SQLVar(followerCount, desc = Column(follower_count, Table(user))), type = 2))',
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
  eq(ta.t1.whereSQLString, 'SQL(E(Column(id, Table(user)), type = 1), E( = 1, type = 0))');
  eq(ta.t2.whereSQLString, 'SQL(E(Column(id, Table(user)), type = 1), E( = 1, type = 0))');
});
