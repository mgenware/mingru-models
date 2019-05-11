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
  expect(v.setters.size).toBe(2);

  const vTitle = v.setters.get(post.title) as dd.SQL;
  const vUserID = v.setters.get(post.snake_case_user_id) as dd.SQL;
  expect(vTitle.toString()).toBe('<title: [title]>');
  expect(vUserID.toString()).toBe('<snakeCaseUserID: [snake_case_user_id]>');
});

test('Order of setInputs and set', () => {
  class UserTA extends dd.TA {
    t = dd
      .insert()
      .setInputs(user.snake_case_name)
      .set(user.name, user.name.toInput('b'));
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  expect(v.setters.size).toBe(2);
  const vName = v.setters.get(user.name) as dd.SQL;
  const vSnakeName = v.setters.get(user.snake_case_name) as dd.SQL;

  expect(vName.toString()).toBe('<b: [name]>');
  expect(vSnakeName.toString()).toBe('<snakeCaseName: [snake_case_name]>');
});

test('Set same column twice (two set())', () => {
  class UserTA extends dd.TA {
    t = dd
      .insert()
      .set(user.name, user.name.toInput('a'))
      .setInputs(user.snake_case_name, user.name)
      .set(user.name, user.name.toInput('b'));
  }
  expect(() => dd.ta(user, UserTA)).toThrow('twice');
});

test('Set same column twice (set() and setInputs())', () => {
  class UserTA extends dd.TA {
    t = dd
      .insert()
      .setInputs(user.snake_case_name, user.name)
      .set(user.name, user.name.toInput('a'));
  }
  expect(() => dd.ta(user, UserTA)).toThrow('twice');
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

test('getInputs', () => {
  class UserTA extends dd.TA {
    t = dd
      .insert()
      .setInputs(user.snake_case_name, user.id)
      .set(user.name, user.name.toInput('b'));
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  expect(v.getInputs().list).toEqual([
    user.snake_case_name.toInput(),
    user.id.toInput(),
    user.name.toInput('b'),
  ]);
  expect(v.getInputs().sealed).toBe(true);
});
