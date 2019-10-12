import * as dd from '../../';
import user from '../models/user';
import * as assert from 'assert';

const expect = assert.equal;
const ok = assert.ok;

it('Update', () => {
  class UserTA extends dd.TableActions {
    t = dd
      .updateSome()
      .set(user.name, dd.sql`${dd.input(user.name)}`)
      .set(user.follower_count, dd.sql`${user.follower_count} + 1`)
      .where(dd.sql`${user.id} = 1`);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  expect(v.actionType, dd.ActionType.update);
  ok(v instanceof dd.UpdateAction);
  ok(v instanceof dd.CoreUpdateAction);
  ok(v instanceof dd.Action);
  expect(
    v.whereSQL,
    'SQL(E(Column(id, Table(user)), type = 1), E( = 1, type = 0))',
  );
  expect(v.setters.size, 2);

  // extra props
  expect(v.ensureOneRowAffected, false);
  expect(v.allowNoWhere, false);
  expect(
    v.settersToString(),
    'name: SQL(E(SQLVar(name, desc = Column(name, Table(user))), type = 2)), follower_count: SQL(E(Column(follower_count, Table(user)), type = 1), E( + 1, type = 0))',
  );
});

it('Order of setInputs and set', () => {
  class UserTA extends dd.TableActions {
    t = dd
      .unsafeUpdateAll()
      .setInputs(user.snake_case_name)
      .set(user.name, user.name.toInput('b'));
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  expect(
    v.settersToString(),
    'snake_case_name: SQL(E(SQLVar(snakeCaseName, desc = Column(snake_case_name, Table(user))), type = 2)), name: SQL(E(SQLVar(b, desc = Column(name, Table(user))), type = 2))',
  );
});

it('setInputs and setDefaults', () => {
  class UserTA extends dd.TableActions {
    t = dd
      .unsafeUpdateAll()
      .setDefaults(user.def_value)
      .setInputs(user.snake_case_name);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  expect(
    v.settersToString(),
    'def_value: SQL(E(abc, type = 0)), snake_case_name: SQL(E(SQLVar(snakeCaseName, desc = Column(snake_case_name, Table(user))), type = 2))',
  );
});

it('setInputs with no args', () => {
  class UserTA extends dd.TableActions {
    t = dd
      .unsafeUpdateAll()
      .setDefaults(user.def_value)
      .setInputs(user.snake_case_name)
      .setInputs();
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  expect(
    v.settersToString(),
    'def_value: SQL(E(abc, type = 0)), snake_case_name: SQL(E(SQLVar(snakeCaseName, desc = Column(snake_case_name, Table(user))), type = 2))',
  );
  expect(v.autoSetter, 'input');
});

it('setDefaults with no args', () => {
  class UserTA extends dd.TableActions {
    t = dd
      .unsafeUpdateAll()
      .setDefaults(user.def_value)
      .setInputs(user.snake_case_name)
      .setDefaults();
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  expect(
    v.settersToString(),
    'def_value: SQL(E(abc, type = 0)), snake_case_name: SQL(E(SQLVar(snakeCaseName, desc = Column(snake_case_name, Table(user))), type = 2))',
  );
  expect(v.autoSetter, 'default');
});

it('setInputs and setDefaults twice', () => {
  assert.throws(() => {
    class UserTA extends dd.TableActions {
      t = dd
        .unsafeUpdateAll()
        .setInputs()
        .setDefaults();
    }
    dd.ta(user, UserTA);
  }, 'already set');
  assert.throws(() => {
    class UserTA extends dd.TableActions {
      t = dd
        .unsafeUpdateAll()
        .setDefaults()
        .setInputs();
    }
    dd.ta(user, UserTA);
  }, 'already set');
});

it('Set same column twice', () => {
  class UserTA extends dd.TableActions {
    t = dd
      .unsafeUpdateAll()
      .set(user.name, user.name.toInput('a'))
      .setInputs(user.snake_case_name, user.name)
      .set(user.name, user.name.toInput('b'));
  }
  assert.throws(() => dd.ta(user, UserTA), 'already set');
});

it('updateOne', () => {
  class UserTA extends dd.TableActions {
    t = dd
      .updateOne()
      .setInputs(user.snake_case_name)
      .byID();
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  // extra props
  expect(v.ensureOneRowAffected, true);
  expect(v.allowNoWhere, false);

  // Throw error when WHERE is empty
  assert.throws(() => {
    class TA extends dd.TableActions {
      t = dd.updateOne().setInputs(user.snake_case_name);
    }
    dd.ta(user, TA);
  }, 'unsafeUpdateAll');
});

it('updateSome', () => {
  class UserTA extends dd.TableActions {
    t = dd
      .updateSome()
      .setInputs(user.snake_case_name)
      .byID();
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  // extra props
  expect(v.ensureOneRowAffected, false);
  expect(v.allowNoWhere, false);

  // Throw error when WHERE is empty
  assert.throws(() => {
    class TA extends dd.TableActions {
      t = dd.updateSome().setInputs(user.snake_case_name);
    }
    dd.ta(user, TA);
  }, 'unsafeUpdateAll');
});

it('unsafeUpdateAll', () => {
  class UserTA extends dd.TableActions {
    t = dd.unsafeUpdateAll().setInputs(user.snake_case_name);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  // extra props
  expect(v.ensureOneRowAffected, false);
  expect(v.allowNoWhere, true);
});

it('ByID', () => {
  class UserTA extends dd.TableActions {
    t = dd
      .updateOne()
      .setInputs(user.snake_case_name)
      .byID();
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  expect(
    v.whereSQL,
    'SQL(E(Column(id, Table(user)), type = 1), E( = , type = 0), E(SQLVar(id, desc = Column(id, Table(user))), type = 2))',
  );
});

it('SQLConvertible value', () => {
  class UserTA extends dd.TableActions {
    t = dd
      .updateOne()
      .set(user.name, dd.dateNow())
      .byID();
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  expect(
    v.setters.get(user.name),
    'SQL(E(SQLCall(1, return = ColType(SQL.DATE), type = 3))',
  );
});

it('No setters', () => {
  assert.throws(() => {
    class UserTA extends dd.TableActions {
      t = dd.unsafeUpdateAll();
    }
    dd.ta(user, UserTA);
  }, 'setter');
  assert.doesNotThrow(() => {
    class UserTA extends dd.TableActions {
      t = dd.unsafeUpdateAll().setInputs();
    }
    dd.ta(user, UserTA);
  });
  assert.doesNotThrow(() => {
    class UserTA extends dd.TableActions {
      t = dd.unsafeUpdateAll().setDefaults();
    }
    dd.ta(user, UserTA);
  });
});

it('by', () => {
  class UserTA extends dd.TableActions {
    t = dd
      .updateOne()
      .setInputs(user.def_value)
      .by(user.snake_case_name);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  expect(
    v.whereSQL,
    'SQL(E(SQLVar(snakeCaseName, desc = Column(snake_case_name, Table(user))), type = 2))',
  );
});

it('andBy', () => {
  class UserTA extends dd.TableActions {
    t1 = dd
      .updateOne()
      .setInputs(user.name)
      .by(user.snake_case_name)
      .andBy(user.follower_count);
    t2 = dd
      .updateOne()
      .setInputs(user.name)
      .andBy(user.follower_count);
    t3 = dd
      .updateOne()
      .setInputs(user.name)
      .byID()
      .andBy(user.follower_count);
  }
  const ta = dd.ta(user, UserTA);
  expect(
    ta.t1.whereSQL,
    'SQL(E(SQLVar(snakeCaseName, desc = Column(snake_case_name, Table(user))), type = 2), E( AND , type = 0), E(SQLVar(followerCount, desc = Column(follower_count, Table(user))), type = 2))',
  );
  expect(
    ta.t2.whereSQL,
    'SQL(E(SQLVar(followerCount, desc = Column(follower_count, Table(user))), type = 2))',
  );
  expect(
    ta.t3.whereSQL,
    'SQL(E(Column(id, Table(user)), type = 1), E( = , type = 0), E(SQLVar(id, desc = Column(id, Table(user))), type = 2), E( AND , type = 0), E(SQLVar(followerCount, desc = Column(follower_count, Table(user))), type = 2))',
  );
});
