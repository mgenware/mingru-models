/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as assert from 'assert';
import { itThrows } from 'it-throws';
import * as mm from '../../dist/main.js';
import user from '../models/user.js';
import { eq, ok, deepEq } from '../assert-aliases.js';

it('Update', () => {
  class UserTA extends mm.ActionGroup {
    t = mm
      .updateSome()
      .set(user.name, mm.sql`${mm.param(user.name)}`)
      .set(user.follower_count, mm.sql`${user.follower_count} + 1`)
      .whereSQL(mm.sql`${user.id} = 1`);
  }
  const ta = mm.actionGroup(user, UserTA);
  const v = ta.t;
  const vd = v.__getData();

  eq(vd.actionType, mm.ActionType.update);
  ok(v instanceof mm.UpdateAction);
  ok(v instanceof mm.CoreUpdateAction);
  ok(v instanceof mm.Action);
  eq(v.__whereSQLString, '`Column(id, t=User(user)) = 1`');
  eq(vd.setters?.size, 2);
  eq(v.toString(), 'UpdateAction(t, t=User(user))');

  // extra props
  eq(vd.ensureOneRowAffected, false);
  eq(vd.unsafeMode, false);
  eq(
    v.__settersToString(),
    'name: `VAR(Column(name, t=User(user)))`, follower_count: `Column(follower_count, t=User(user)) + 1`',
  );
});

it('Order of setParams and set', () => {
  class UserTA extends mm.ActionGroup {
    t = mm.unsafeUpdateAll().setParams(user.snake_case_name).set(user.name, user.name.toParam('b'));
  }
  const ta = mm.actionGroup(user, UserTA);
  const v = ta.t;

  eq(
    v.__settersToString(),
    'snake_case_name: `VAR(Column(snake_case_name, t=User(user)))`, name: `VAR(Column(name, t=User(user)), name=b)`',
  );
});

it('setParams and setDefaults', () => {
  class UserTA extends mm.ActionGroup {
    t = mm.unsafeUpdateAll().setDefaults(user.def_value).setParams(user.snake_case_name);
  }
  const ta = mm.actionGroup(user, UserTA);
  const v = ta.t;

  eq(
    v.__settersToString(),
    'def_value: abc, snake_case_name: `VAR(Column(snake_case_name, t=User(user)))`',
  );
});

it('setParams with no args', () => {
  class UserTA extends mm.ActionGroup {
    t = mm
      .unsafeUpdateAll()
      .setDefaults(user.def_value)
      .setParams(user.snake_case_name)
      .setParams();
  }
  const ta = mm.actionGroup(user, UserTA);
  const v = ta.t;

  eq(
    v.__settersToString(),
    'def_value: abc, snake_case_name: `VAR(Column(snake_case_name, t=User(user)))`',
  );
  deepEq([...v.__getData().autoSetters!], [mm.AutoSetterType.param]);
});

it('setDefaults with no args', () => {
  class UserTA extends mm.ActionGroup {
    t = mm
      .unsafeUpdateAll()
      .setDefaults(user.def_value)
      .setParams(user.snake_case_name)
      .setDefaults();
  }
  const ta = mm.actionGroup(user, UserTA);
  const v = ta.t;

  eq(
    v.__settersToString(),
    'def_value: abc, snake_case_name: `VAR(Column(snake_case_name, t=User(user)))`',
  );
  deepEq([...v.__getData().autoSetters!], [mm.AutoSetterType.default]);
});

it('setParams and setDefaults twice', () => {
  {
    class UserTA extends mm.ActionGroup {
      t = mm.unsafeUpdateAll().setParams().setDefaults();
    }
    mm.actionGroup(user, UserTA);

    const ta = mm.actionGroup(user, UserTA);
    const v = ta.t;

    deepEq([...v.__getData().autoSetters!], [mm.AutoSetterType.param, mm.AutoSetterType.default]);
  }
  {
    class UserTA extends mm.ActionGroup {
      t = mm.unsafeUpdateAll().setDefaults().setParams();
    }
    mm.actionGroup(user, UserTA);

    const ta = mm.actionGroup(user, UserTA);
    const v = ta.t;

    deepEq([...v.__getData().autoSetters!], [mm.AutoSetterType.default, mm.AutoSetterType.param]);
  }
});

it('Set same column twice', () => {
  class UserTA extends mm.ActionGroup {
    t = mm
      .unsafeUpdateAll()
      .set(user.name, user.name.toParam('a'))
      .setParams(user.snake_case_name, user.name)
      .set(user.name, user.name.toParam('b'));
  }
  itThrows(
    () => mm.actionGroup(user, UserTA),
    'Column "Column(name, t=User(user))" is already set [table "User(user)"]',
  );
});

it('updateOne', () => {
  class UserTA extends mm.ActionGroup {
    t = mm.updateOne().setParams(user.snake_case_name).by(user.id);
  }
  const ta = mm.actionGroup(user, UserTA);
  const v = ta.t;
  const vd = v.__getData();

  // extra props
  eq(vd.ensureOneRowAffected, true);
  eq(vd.unsafeMode, false);

  itThrows(() => {
    class TA extends mm.ActionGroup {
      t = mm.updateOne().setParams(user.snake_case_name);
    }
    mm.actionGroup(user, TA);
  }, '`unsafeMode` is not on, you must define a WHERE clause. Otherwise, use `unsafeUpdateAll` [action "t"] [table "User(user)"]');
});

it('updateSome', () => {
  class UserTA extends mm.ActionGroup {
    t = mm.updateSome().setParams(user.snake_case_name).by(user.id);
  }
  const ta = mm.actionGroup(user, UserTA);
  const v = ta.t;
  const vd = v.__getData();

  // extra props
  eq(vd.ensureOneRowAffected, false);
  eq(vd.unsafeMode, false);

  itThrows(() => {
    class TA extends mm.ActionGroup {
      t = mm.updateSome().setParams(user.snake_case_name);
    }
    mm.actionGroup(user, TA);
  }, '`unsafeMode` is not on, you must define a WHERE clause. Otherwise, use `unsafeUpdateAll` [action "t"] [table "User(user)"]');
});

it('unsafeUpdateAll', () => {
  class UserTA extends mm.ActionGroup {
    t = mm.unsafeUpdateAll().setParams(user.snake_case_name);
  }
  const ta = mm.actionGroup(user, UserTA);
  const v = ta.t;
  const vd = v.__getData();

  // extra props
  eq(vd.ensureOneRowAffected, false);
  eq(vd.unsafeMode, true);
});

it('ByID', () => {
  class UserTA extends mm.ActionGroup {
    t = mm.updateOne().setParams(user.snake_case_name).by(user.id);
  }
  const ta = mm.actionGroup(user, UserTA);
  const v = ta.t;

  eq(v.__whereSQLString, '`Column(id, t=User(user)) = VAR(Column(id, t=User(user)))`');
});

it('SQLConvertible value', () => {
  class UserTA extends mm.ActionGroup {
    t = mm.updateOne().set(user.name, mm.dateNow()).by(user.id);
  }
  const ta = mm.actionGroup(user, UserTA);
  const v = ta.t;
  const vd = v.__getData();

  eq(`${vd.setters?.get(user.name)}`, '`DATENOW()`');
});

it('No setters', () => {
  itThrows(() => {
    class UserTA extends mm.ActionGroup {
      t = mm.unsafeUpdateAll();
    }
    mm.actionGroup(user, UserTA);
  }, 'No setters [action "t"] [table "User(user)"]');
  assert.doesNotThrow(() => {
    class UserTA extends mm.ActionGroup {
      t = mm.unsafeUpdateAll().setParams();
    }
    mm.actionGroup(user, UserTA);
  });
  assert.doesNotThrow(() => {
    class UserTA extends mm.ActionGroup {
      t = mm.unsafeUpdateAll().setDefaults();
    }
    mm.actionGroup(user, UserTA);
  });
});

it('by', () => {
  class UserTA extends mm.ActionGroup {
    t = mm.updateOne().setParams(user.def_value).by(user.snake_case_name);
  }
  const ta = mm.actionGroup(user, UserTA);
  const v = ta.t;
  eq(
    v.__whereSQLString,
    '`Column(snake_case_name, t=User(user)) = VAR(Column(snake_case_name, t=User(user)))`',
  );
});

it('andBy', () => {
  class UserTA extends mm.ActionGroup {
    t1 = mm.updateOne().setParams(user.name).by(user.snake_case_name).andBy(user.follower_count);

    t2 = mm.updateOne().setParams(user.name).andBy(user.follower_count);
    t3 = mm.updateOne().setParams(user.name).by(user.id).andBy(user.follower_count);
  }
  const ta = mm.actionGroup(user, UserTA);
  eq(
    ta.t1.__whereSQLString,
    '`(Column(snake_case_name, t=User(user)) = VAR(Column(snake_case_name, t=User(user))) AND VAR(Column(follower_count, t=User(user))))`',
  );
  eq(ta.t2.__whereSQLString, '`VAR(Column(follower_count, t=User(user)))`');
  eq(
    ta.t3.__whereSQLString,
    '`(Column(id, t=User(user)) = VAR(Column(id, t=User(user))) AND VAR(Column(follower_count, t=User(user))))`',
  );
});

it('where and whereSQL', () => {
  class UserTA extends mm.ActionGroup {
    t1 = mm
      .updateOne()
      .set(user.name, user.name.toParam())
      .whereSQL(mm.sql`${user.id} = 1`);

    t2 = mm.updateOne().set(user.name, user.name.toParam()).where`${user.id} = 1`;
  }
  const ta = mm.actionGroup(user, UserTA);
  eq(ta.t1.__whereSQLString, '`Column(id, t=User(user)) = 1`');
  eq(ta.t2.__whereSQLString, '`Column(id, t=User(user)) = 1`');
});

it('addAssign', () => {
  class UserTA extends mm.ActionGroup {
    t = mm
      .updateOne()
      .addAssign(user.follower_count, mm.sql`1`)
      .by(user.id);
  }
  const ta = mm.actionGroup(user, UserTA);
  const v = ta.t;

  eq(v.__settersToString(), 'follower_count: `Column(follower_count, t=User(user)) + 1`');
});

it('subAssign', () => {
  class UserTA extends mm.ActionGroup {
    t = mm
      .updateOne()
      .subAssign(user.follower_count, mm.sql`1`)
      .by(user.id);
  }
  const ta = mm.actionGroup(user, UserTA);
  const v = ta.t;

  eq(v.__settersToString(), 'follower_count: `Column(follower_count, t=User(user)) - 1`');
});
