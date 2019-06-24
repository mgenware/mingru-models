import * as dd from '../../';
import user from '../models/user';
import post from '../models/post';

test('Insert', () => {
  class UserTA extends dd.TA {
    t = dd
      .insert()
      .setInputs(post.title, post.snake_case_user_id)
      .setInputs();
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  expect(v.actionType).toBe(dd.ActionType.insert);
  expect(v.ensureOneRowAffected).toBeFalsy();
  expect(v).toBeInstanceOf(dd.InsertAction);
  expect(v).toBeInstanceOf(dd.CoreUpdateAction);
  expect(v.settersToString()).toBe(
    'title: <title: [title]>, snake_case_user_id: <snakeCaseUserID: [snake_case_user_id]>',
  );
});

test('Insert one', () => {
  class UserTA extends dd.TA {
    t = dd
      .insertOne()
      .setInputs(post.title, post.snake_case_user_id)
      .setInputs();
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  expect(v.ensureOneRowAffected).toBeTruthy();
});

test('unsafeInsert', () => {
  class UserTA extends dd.TA {
    t = dd.unsafeInsert().setInputs(post.title, post.snake_case_user_id);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  expect(v.noColumnNumberCheck).toBeTruthy();
});

test('unsafeInsertOne', () => {
  class UserTA extends dd.TA {
    t = dd.unsafeInsertOne().setInputs(post.title, post.snake_case_user_id);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  expect(v.ensureOneRowAffected).toBeTruthy();
  expect(v.noColumnNumberCheck).toBeTruthy();
});

test('SQLConvertible value', () => {
  class UserTA extends dd.TA {
    t = dd
      .unsafeInsert()
      .set(post.title, dd.dateNow())
      .setDefaults();
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  expect(v.setters.get(post.title)!.toString()).toBe('CALL(1)');
});

test('No setters', () => {
  expect(() => {
    class PostTA extends dd.TA {
      t = dd.insert();
    }
    dd.ta(post, PostTA);
  }).toThrow('setter');
});

test('Column number check', () => {
  expect(() => {
    class PostTA extends dd.TA {
      t = dd.insert().setInputs(post.e_user_id);
    }
    dd.ta(post, PostTA);
  }).toThrow('all columns');
  expect(() => {
    class PostTA extends dd.TA {
      t = dd.insert().setInputs();
    }
    dd.ta(post, PostTA);
  }).not.toThrow();
  expect(() => {
    class PostTA extends dd.TA {
      t = dd.unsafeInsert().setInputs(post.e_user_id);
    }
    dd.ta(post, PostTA);
  }).not.toThrow();
});
