/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as assert from 'assert';
import { itThrows } from 'it-throws';
import * as mm from '../../dist/main.js';
import post from '../models/post.js';
import { deepEq, eq, ok } from '../assert-aliases.js';

it('Insert', () => {
  class PostTA extends mm.ActionGroup {
    t = mm.insert().setParams(post.title, post.snake_case_user_id).setParams();
  }
  const ta = mm.actionGroup(post, PostTA);
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
  class PostTA extends mm.ActionGroup {
    t = mm.insertOne().setParams(post.title, post.snake_case_user_id).setParams();
  }
  const ta = mm.actionGroup(post, PostTA);
  const v = ta.t;
  const vd = v.__getData();

  eq(vd.ensureOneRowAffected, true);
});

it('unsafeInsert', () => {
  class PostTA extends mm.ActionGroup {
    t = mm.unsafeInsert().setParams(post.title, post.snake_case_user_id);
  }
  const ta = mm.actionGroup(post, PostTA);
  const v = ta.t;
  const vd = v.__getData();

  eq(vd.allowUnsetColumns, true);
});

it('unsafeInsertOne', () => {
  class PostTA extends mm.ActionGroup {
    t = mm.unsafeInsertOne().setParams(post.title, post.snake_case_user_id);
  }
  const ta = mm.actionGroup(post, PostTA);
  const v = ta.t;
  const vd = v.__getData();

  eq(vd.ensureOneRowAffected, true);
  eq(vd.allowUnsetColumns, true);
});

it('SQLConvertible value', () => {
  class PostTA extends mm.ActionGroup {
    t = mm.unsafeInsert().set(post.title, mm.dateNow()).setDefaults();
  }
  const ta = mm.actionGroup(post, PostTA);
  const v = ta.t;
  const vd = v.__getData();

  deepEq(
    vd.setters,
    new Map<mm.Column, mm.SQLConvertible>([[post.title, mm.sql`${mm.dateNow()}`]]),
  );
  eq(`${vd.setters!.get(post.title)}`, '`DATENOW()`');
});

it('No setters', () => {
  itThrows(() => {
    class PostTA extends mm.ActionGroup {
      t = mm.insert();
    }
    mm.actionGroup(post, PostTA);
  }, 'No setters [action "t"] [table "Post(post)"]');
});

it('Column number check', () => {
  itThrows(() => {
    class PostTA extends mm.ActionGroup {
      t = mm.insert().setParams(post.e_user_id);
    }
    mm.actionGroup(post, PostTA);
  }, 'You only set 1 of all 5 columns (not including AUTO_INCREMENT columns), you should set all columns or use `unsafeInsert` to bypass this check [action "t"] [table "Post(post)"]');
  assert.doesNotThrow(() => {
    class PostTA extends mm.ActionGroup {
      t = mm.insert().setParams();
    }
    mm.actionGroup(post, PostTA);
  });
  assert.doesNotThrow(() => {
    class PostTA extends mm.ActionGroup {
      t = mm.unsafeInsert().setParams(post.e_user_id);
    }
    mm.actionGroup(post, PostTA);
  });
});
