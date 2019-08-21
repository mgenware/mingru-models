import * as dd from '../../';
import user from '../models/user';
import post from '../models/post';
import * as assert from 'assert';

const expect = assert.equal;
const ok = assert.ok;

it('Insert', () => {
  class UserTA extends dd.TA {
    t = dd
      .insert()
      .setInputs(post.title, post.snake_case_user_id)
      .setInputs();
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  expect(v.actionType, dd.ActionType.insert);
  expect(v.ensureOneRowAffected, false);
  ok(v instanceof dd.InsertAction);
  ok(v instanceof dd.CoreUpdateAction);
  expect(
    v.settersToString(),
    'title: <title: [title]>, snake_case_user_id: <snakeCaseUserID: [snake_case_user_id]>',
  );
});

it('Insert one', () => {
  class UserTA extends dd.TA {
    t = dd
      .insertOne()
      .setInputs(post.title, post.snake_case_user_id)
      .setInputs();
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  expect(v.ensureOneRowAffected, true);
});

it('unsafeInsert', () => {
  class UserTA extends dd.TA {
    t = dd.unsafeInsert().setInputs(post.title, post.snake_case_user_id);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  expect(v.noColumnNumberCheck, true);
});

it('unsafeInsertOne', () => {
  class UserTA extends dd.TA {
    t = dd.unsafeInsertOne().setInputs(post.title, post.snake_case_user_id);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  expect(v.ensureOneRowAffected, true);
  expect(v.noColumnNumberCheck, true);
});

it('SQLConvertible value', () => {
  class UserTA extends dd.TA {
    t = dd
      .unsafeInsert()
      .set(post.title, dd.dateNow())
      .setDefaults();
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  expect(v.setters.get(post.title)!.toString(), 'CALL(1)');
});

it('No setters', () => {
  assert.throws(() => {
    class PostTA extends dd.TA {
      t = dd.insert();
    }
    dd.ta(post, PostTA);
  }, 'setter');
});

it('Column number check', () => {
  assert.throws(() => {
    class PostTA extends dd.TA {
      t = dd.insert().setInputs(post.e_user_id);
    }
    dd.ta(post, PostTA);
  }, 'all columns');
  assert.doesNotThrow(() => {
    class PostTA extends dd.TA {
      t = dd.insert().setInputs();
    }
    dd.ta(post, PostTA);
  });
  assert.doesNotThrow(() => {
    class PostTA extends dd.TA {
      t = dd.unsafeInsert().setInputs(post.e_user_id);
    }
    dd.ta(post, PostTA);
  });
});
