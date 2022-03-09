/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as assert from 'assert';
import { itThrows } from 'it-throws';
import * as mm from '../../dist/main.js';
import post from '../models/post.js';
import { deepEq, eq, ok } from '../assert-aliases.js';

it('Insert', () => {
  class PostTA extends mm.TableActions {
    t = mm.insert().setInputs(post.title, post.snake_case_user_id).setInputs();
  }
  const ta = mm.tableActions(post, PostTA);
  const v = ta.t;
  const vd = v.__getData();

  eq(vd.actionType, mm.ActionType.insert);
  eq(vd.ensureOneRowAffected, false);
  ok(v instanceof mm.InsertAction);
  ok(v instanceof mm.CoreUpdateAction);
  eq(
    v.__settersToString(),
    'title: `VAR(Column(title, t=Post(post)))`, snake_case_user_id: `VAR(Column(snake_case_user_id, t=Post(post)))`',
  );
  eq(v.toString(), 'InsertAction(t, t=Post(post))');
});

it('Insert one', () => {
  class PostTA extends mm.TableActions {
    t = mm.insertOne().setInputs(post.title, post.snake_case_user_id).setInputs();
  }
  const ta = mm.tableActions(post, PostTA);
  const v = ta.t;
  const vd = v.__getData();

  eq(vd.ensureOneRowAffected, true);
});

it('unsafeInsert', () => {
  class PostTA extends mm.TableActions {
    t = mm.unsafeInsert().setInputs(post.title, post.snake_case_user_id);
  }
  const ta = mm.tableActions(post, PostTA);
  const v = ta.t;
  const vd = v.__getData();

  eq(vd.allowUnsetColumns, true);
});

it('unsafeInsertOne', () => {
  class PostTA extends mm.TableActions {
    t = mm.unsafeInsertOne().setInputs(post.title, post.snake_case_user_id);
  }
  const ta = mm.tableActions(post, PostTA);
  const v = ta.t;
  const vd = v.__getData();

  eq(vd.ensureOneRowAffected, true);
  eq(vd.allowUnsetColumns, true);
});

it('SQLConvertible value', () => {
  class PostTA extends mm.TableActions {
    t = mm.unsafeInsert().set(post.title, mm.localDateNow()).setDefaults();
  }
  const ta = mm.tableActions(post, PostTA);
  const v = ta.t;
  const vd = v.__getData();

  deepEq(vd.setters, new Map<mm.Column, unknown>([[post.title, mm.sql`${mm.localDateNow()}`]]));
  eq(`${vd.setters!.get(post.title)}`, '`LOCALDATENOW()`');
});

it('No setters', () => {
  itThrows(() => {
    class PostTA extends mm.TableActions {
      t = mm.insert();
    }
    mm.tableActions(post, PostTA);
  }, 'No setters [action "t"] [table "Post(post)"]');
});

it('Column number check', () => {
  itThrows(() => {
    class PostTA extends mm.TableActions {
      t = mm.insert().setInputs(post.e_user_id);
    }
    mm.tableActions(post, PostTA);
  }, 'You only set 1 of all 5 columns (not including AUTO_INCREMENT columns), you should set all columns or use `unsafeInsert` to bypass this check [action "t"] [table "Post(post)"]');
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
