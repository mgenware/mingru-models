import * as dd from '../../';
import user from '../models/user';
import * as assert from 'assert';

const expect = assert.equal;
const ok = assert.ok;

it('Update', () => {
  class UserTA extends dd.TA {
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
  expect(v.whereSQL!.toString(), '`id` = 1');
  expect(v.setters.size, 2);

  // extra props
  expect(v.ensureOneRowAffected, false);
  expect(v.allowNoWhere, false);
  expect(
    v.settersToString(),
    'name: <name: [name]>, follower_count: `follower_count` + 1',
  );
});

it('Order of setInputs and set', () => {
  class UserTA extends dd.TA {
    t = dd
      .unsafeUpdateAll()
      .setInputs(user.snake_case_name)
      .set(user.name, user.name.toInput('b'));
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  expect(
    v.settersToString(),
    'snake_case_name: <snakeCaseName: [snake_case_name]>, name: <b: [name]>',
  );
});

it('setInputs and setDefaults', () => {
  class UserTA extends dd.TA {
    t = dd
      .unsafeUpdateAll()
      .setDefaults(user.def_value)
      .setInputs(user.snake_case_name);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  expect(
    v.settersToString(),
    'def_value: abc, snake_case_name: <snakeCaseName: [snake_case_name]>',
  );
});

it('setInputs with no args', () => {
  class UserTA extends dd.TA {
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
    'def_value: abc, snake_case_name: <snakeCaseName: [snake_case_name]>',
  );
  expect(v.autoSetter, 'input');
});

it('setDefaults with no args', () => {
  class UserTA extends dd.TA {
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
    'def_value: abc, snake_case_name: <snakeCaseName: [snake_case_name]>',
  );
  expect(v.autoSetter, 'default');
});

it('setInputs and setDefaults twice', () => {
  assert.throws(() => {
    class UserTA extends dd.TA {
      t = dd
        .unsafeUpdateAll()
        .setInputs()
        .setDefaults();
    }
    dd.ta(user, UserTA);
  }, 'already set');
  assert.throws(() => {
    class UserTA extends dd.TA {
      t = dd
        .unsafeUpdateAll()
        .setDefaults()
        .setInputs();
    }
    dd.ta(user, UserTA);
  }, 'already set');
});

it('Set same column twice', () => {
  class UserTA extends dd.TA {
    t = dd
      .unsafeUpdateAll()
      .set(user.name, user.name.toInput('a'))
      .setInputs(user.snake_case_name, user.name)
      .set(user.name, user.name.toInput('b'));
  }
  assert.throws(() => dd.ta(user, UserTA), 'already set');
});

it('updateOne', () => {
  class UserTA extends dd.TA {
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
    class TA extends dd.TA {
      t = dd.updateOne().setInputs(user.snake_case_name);
    }
    dd.ta(user, TA);
  }, 'unsafeUpdateAll');
});

it('updateSome', () => {
  class UserTA extends dd.TA {
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
    class TA extends dd.TA {
      t = dd.updateSome().setInputs(user.snake_case_name);
    }
    dd.ta(user, TA);
  }, 'unsafeUpdateAll');
});

it('unsafeUpdateAll', () => {
  class UserTA extends dd.TA {
    t = dd.unsafeUpdateAll().setInputs(user.snake_case_name);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  // extra props
  expect(v.ensureOneRowAffected, false);
  expect(v.allowNoWhere, true);
});

it('ByID', () => {
  class UserTA extends dd.TA {
    t = dd
      .updateOne()
      .setInputs(user.snake_case_name)
      .byID();
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  expect(v.whereSQL!.toString(), '`id` = <id: [id]>');
});

it('SQLConvertible value', () => {
  class UserTA extends dd.TA {
    t = dd
      .updateOne()
      .set(user.name, dd.dateNow())
      .byID();
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  expect(v.setters.get(user.name)!.toString(), 'CALL(1)');
});

it('No setters', () => {
  assert.throws(() => {
    class UserTA extends dd.TA {
      t = dd.unsafeUpdateAll();
    }
    dd.ta(user, UserTA);
  }, 'setter');
  assert.doesNotThrow(() => {
    class UserTA extends dd.TA {
      t = dd.unsafeUpdateAll().setInputs();
    }
    dd.ta(user, UserTA);
  });
  assert.doesNotThrow(() => {
    class UserTA extends dd.TA {
      t = dd.unsafeUpdateAll().setDefaults();
    }
    dd.ta(user, UserTA);
  });
});

it('by', () => {
  class UserTA extends dd.TA {
    t = dd
      .updateOne()
      .setInputs(user.def_value)
      .by(user.snake_case_name);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  expect(v.whereSQL!.toString(), '<snakeCaseName: [snake_case_name]>');
});
