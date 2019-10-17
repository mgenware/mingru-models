import * as mm from '../../';
import user from '../models/user';
import post from '../models/post';
import * as assert from 'assert';

const expect = assert.equal;
const ok = assert.ok;

it('Insert', () => {
  class PostTA extends mm.TableActions {
    t = mm
      .insert()
      .setInputs(post.title, post.snake_case_user_id)
      .setInputs();
  }
  const ta = mm.ta(post, PostTA);
  const v = ta.t;

  expect(v.actionType, mm.ActionType.insert);
  expect(v.ensureOneRowAffected, false);
  ok(v instanceof mm.InsertAction);
  ok(v instanceof mm.CoreUpdateAction);
  expect(
    v.settersToString(),
    'title: SQL(E(SQLVar(title, desc = Column(title, Table(post))), type = 2)), snake_case_user_id: SQL(E(SQLVar(snakeCaseUserID, desc = Column(snake_case_user_id, Table(post))), type = 2))',
  );
});

it('Insert one', () => {
  class PostTA extends mm.TableActions {
    t = mm
      .insertOne()
      .setInputs(post.title, post.snake_case_user_id)
      .setInputs();
  }
  const ta = mm.ta(post, PostTA);
  const v = ta.t;

  expect(v.ensureOneRowAffected, true);
});

it('unsafeInsert', () => {
  class PostTA extends mm.TableActions {
    t = mm.unsafeInsert().setInputs(post.title, post.snake_case_user_id);
  }
  const ta = mm.ta(post, PostTA);
  const v = ta.t;
  expect(v.noColumnNumberCheck, true);
});

it('unsafeInsertOne', () => {
  class PostTA extends mm.TableActions {
    t = mm.unsafeInsertOne().setInputs(post.title, post.snake_case_user_id);
  }
  const ta = mm.ta(post, PostTA);
  const v = ta.t;
  expect(v.ensureOneRowAffected, true);
  expect(v.noColumnNumberCheck, true);
});

it('SQLConvertible value', () => {
  class PostTA extends mm.TableActions {
    t = mm
      .unsafeInsert()
      .set(post.title, mm.dateNow())
      .setDefaults();
  }
  const ta = mm.ta(post, PostTA);
  const v = ta.t;
  expect(
    v.setters.get(post.title),
    'SQL(E(SQLCall(1, return = ColType(SQL.DATE), type = 3))',
  );
});

it('No setters', () => {
  assert.throws(() => {
    class PostTA extends mm.TableActions {
      t = mm.insert();
    }
    mm.ta(post, PostTA);
  }, 'setter');
});

it('Column number check', () => {
  assert.throws(() => {
    class PostTA extends mm.TableActions {
      t = mm.insert().setInputs(post.e_user_id);
    }
    mm.ta(post, PostTA);
  }, 'all columns');
  assert.doesNotThrow(() => {
    class PostTA extends mm.TableActions {
      t = mm.insert().setInputs();
    }
    mm.ta(post, PostTA);
  });
  assert.doesNotThrow(() => {
    class PostTA extends mm.TableActions {
      t = mm.unsafeInsert().setInputs(post.e_user_id);
    }
    mm.ta(post, PostTA);
  });
});

it('Validity check', () => {
  assert.throws(
    () => {
      class PostTA extends mm.TableActions {
        t = mm.insertOne().setInputs(user.id);
      }
      mm.ta(post, PostTA);
    },
    {
      message:
        'Source table assertion failed, expected "Table(post)", got "Table(user)".',
    },
  );
});
