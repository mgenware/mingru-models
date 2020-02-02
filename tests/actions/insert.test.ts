import * as mm from '../../';
import post from '../models/post';
import * as assert from 'assert';
import { itThrows } from 'it-throws';

const expect = assert.equal;
const ok = assert.ok;

it('Insert', () => {
  class PostTA extends mm.TableActions {
    t = mm
      .insert()
      .setInputs(post.title, post.snake_case_user_id)
      .setInputs();
  }
  const ta = mm.tableActions(post, PostTA);
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
  const ta = mm.tableActions(post, PostTA);
  const v = ta.t;

  expect(v.ensureOneRowAffected, true);
});

it('unsafeInsert', () => {
  class PostTA extends mm.TableActions {
    t = mm.unsafeInsert().setInputs(post.title, post.snake_case_user_id);
  }
  const ta = mm.tableActions(post, PostTA);
  const v = ta.t;
  expect(v.allowUnsetColumns, true);
});

it('unsafeInsertOne', () => {
  class PostTA extends mm.TableActions {
    t = mm.unsafeInsertOne().setInputs(post.title, post.snake_case_user_id);
  }
  const ta = mm.tableActions(post, PostTA);
  const v = ta.t;
  expect(v.ensureOneRowAffected, true);
  expect(v.allowUnsetColumns, true);
});

it('SQLConvertible value', () => {
  class PostTA extends mm.TableActions {
    t = mm
      .unsafeInsert()
      .set(post.title, mm.localDateNow())
      .setDefaults();
  }
  const ta = mm.tableActions(post, PostTA);
  const v = ta.t;
  assert.deepStrictEqual(
    v.setters,
    new Map<mm.Column, unknown>([[post.title, mm.sql`${mm.localDateNow()}`]]),
  );
  expect(
    v.setters.get(post.title),
    'SQL(E(SQLCall(1, return = ColType(SQL.DATE), type = 3))',
  );
});

it('No setters', () => {
  itThrows(() => {
    class PostTA extends mm.TableActions {
      t = mm.insert();
    }
    mm.tableActions(post, PostTA);
  }, 'No setters [action "t"]');
});

it('Column number check', () => {
  itThrows(() => {
    class PostTA extends mm.TableActions {
      t = mm.insert().setInputs(post.e_user_id);
    }
    mm.tableActions(post, PostTA);
  }, 'You only set 1 of all 5 columns (not including AUTO_INCREMENT columns), you should set all columns or use `unsafeInsert` to bypass this check [action "t"]');
  assert.doesNotThrow(() => {
    class PostTA extends mm.TableActions {
      t = mm.insert().setInputs();
    }
    mm.tableActions(post, PostTA);
  });
  assert.doesNotThrow(() => {
    class PostTA extends mm.TableActions {
      t = mm.unsafeInsert().setInputs(post.e_user_id);
    }
    mm.tableActions(post, PostTA);
  });
});
