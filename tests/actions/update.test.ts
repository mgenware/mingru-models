import * as dd from '../../';
import user from '../models/user';

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

  expect(v.actionType).toBe(dd.ActionType.update);
  expect(v).toBeInstanceOf(dd.UpdateAction);
  expect(v).toBeInstanceOf(dd.CoreUpdateAction);
  expect(v).toBeInstanceOf(dd.Action);
  expect(v.whereSQL!.toString()).toBe('`id` = 1');
  expect(v.setters.size).toBe(2);

  // extra props
  expect(v.ensureOneRowAffected).toBe(false);
  expect(v.allowNoWhere).toBe(false);
  expect(v.settersToString()).toBe(
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

  expect(v.settersToString()).toBe(
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

  expect(v.settersToString()).toBe(
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

  expect(v.settersToString()).toBe(
    'def_value: abc, snake_case_name: <snakeCaseName: [snake_case_name]>',
  );
  expect(v.autoSetter).toBe('input');
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

  expect(v.settersToString()).toBe(
    'def_value: abc, snake_case_name: <snakeCaseName: [snake_case_name]>',
  );
  expect(v.autoSetter).toBe('default');
});

it('setInputs and setDefaults twice', () => {
  expect(() => {
    class UserTA extends dd.TA {
      t = dd
        .unsafeUpdateAll()
        .setInputs()
        .setDefaults();
    }
    dd.ta(user, UserTA);
  }).toThrow('already set');
  expect(() => {
    class UserTA extends dd.TA {
      t = dd
        .unsafeUpdateAll()
        .setDefaults()
        .setInputs();
    }
    dd.ta(user, UserTA);
  }).toThrow('already set');
});

it('Set same column twice', () => {
  class UserTA extends dd.TA {
    t = dd
      .unsafeUpdateAll()
      .set(user.name, user.name.toInput('a'))
      .setInputs(user.snake_case_name, user.name)
      .set(user.name, user.name.toInput('b'));
  }
  expect(() => dd.ta(user, UserTA)).toThrow('already set');
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
  expect(v.ensureOneRowAffected).toBe(true);
  expect(v.allowNoWhere).toBe(false);

  // Throw error when WHERE is empty
  expect(() => {
    class TA extends dd.TA {
      t = dd.updateOne().setInputs(user.snake_case_name);
    }
    dd.ta(user, TA);
  }).toThrow('unsafeUpdateAll');
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
  expect(v.ensureOneRowAffected).toBe(false);
  expect(v.allowNoWhere).toBe(false);

  // Throw error when WHERE is empty
  expect(() => {
    class TA extends dd.TA {
      t = dd.updateSome().setInputs(user.snake_case_name);
    }
    dd.ta(user, TA);
  }).toThrow('unsafeUpdateAll');
});

it('unsafeUpdateAll', () => {
  class UserTA extends dd.TA {
    t = dd.unsafeUpdateAll().setInputs(user.snake_case_name);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  // extra props
  expect(v.ensureOneRowAffected).toBe(false);
  expect(v.allowNoWhere).toBe(true);
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

  expect(v.whereSQL!.toString()).toBe('`id` = <id: [id]>');
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

  expect(v.setters.get(user.name)!.toString()).toBe('CALL(1)');
});

it('No setters', () => {
  expect(() => {
    class UserTA extends dd.TA {
      t = dd.unsafeUpdateAll();
    }
    dd.ta(user, UserTA);
  }).toThrow('setter');
  expect(() => {
    class UserTA extends dd.TA {
      t = dd.unsafeUpdateAll().setInputs();
    }
    dd.ta(user, UserTA);
  }).not.toThrow();
  expect(() => {
    class UserTA extends dd.TA {
      t = dd.unsafeUpdateAll().setDefaults();
    }
    dd.ta(user, UserTA);
  }).not.toThrow();
});
