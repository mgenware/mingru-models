import * as dd from '../../';
import user from '../models/user';
import post from '../models/post';

test('Insert', () => {
  class UserTA extends dd.TA {
    t = dd.insert().setInputs(post.title, post.snake_case_user_id);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  expect(v.actionType).toBe(dd.ActionType.insert);
  expect(v.fetchInsertedID).toBeFalsy();
  expect(v).toBeInstanceOf(dd.InsertAction);
  expect(v.settersToString()).toBe(
    'title: <title: [title]>, snake_case_user_id: <snakeCaseUserID: [snake_case_user_id]>',
  );
});

test('Insert one', () => {
  class UserTA extends dd.TA {
    t = dd.insertOne().setInputs(post.title, post.snake_case_user_id);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  expect(v.fetchInsertedID).toBeTruthy();
  expect(v.withDefaults).toBeFalsy();
});

test('Insert with defaults', () => {
  class UserTA extends dd.TA {
    t = dd.insertWithDefaults().setInputs(post.title, post.snake_case_user_id);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  expect(v.fetchInsertedID).toBeFalsy();
  expect(v.withDefaults).toBeTruthy();
});

test('Insert one with defaults', () => {
  class UserTA extends dd.TA {
    t = dd
      .insertOneWithDefaults()
      .setInputs(post.title, post.snake_case_user_id);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  expect(v.fetchInsertedID).toBeTruthy();
  expect(v.withDefaults).toBeTruthy();
});

test('SQLConvertible value', () => {
  class UserTA extends dd.TA {
    t = dd.insertOneWithDefaults().set(post.title, dd.dateNow());
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
