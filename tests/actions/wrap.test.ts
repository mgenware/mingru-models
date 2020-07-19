import * as assert from 'assert';
import * as mm from '../..';
import user from '../models/user';
import post from '../models/post';

const eq = assert.equal;

it('Wrap', () => {
  class PostTA extends mm.TableActions {
    t = mm.insert().setInputs(post.title, post.snake_case_user_id).setInputs();
  }
  const postTA = mm.tableActions(post, PostTA);
  class UserTA extends mm.TableActions {
    s = mm.deleteOne().byID();
    t2 = postTA.t.wrap({ id: '32' });

    t = this.s.wrap({
      id: '1',
    });
  }
  const ta = mm.tableActions(user, UserTA);
  let v = ta.t;
  assert.ok(v instanceof mm.WrappedAction);
  assert.ok(v instanceof mm.Action);
  eq(v.actionType, mm.ActionType.wrap);
  eq(v.action, ta.s);
  assert.deepEqual(v.args, {
    id: '1',
  });
  eq(ta.s.__table, user);
  eq(v.__table, user);
  eq(v.isTemp, false);

  v = ta.t2;
  eq(v.action, postTA.t);
  eq(postTA.t.__table, post);
  eq(v.__table, user);
  eq(v.isTemp, false);
});

it('Wrap (chains)', () => {
  class PostTA extends mm.TableActions {
    t = mm.insert().setInputs(post.title, post.snake_case_user_id).setInputs();
  }
  const postTA = mm.tableActions(post, PostTA);
  class UserTA extends mm.TableActions {
    s = mm.deleteOne().byID();
    t = this.s.wrap({ id: '32' }).wrap({ id: '33' }).wrap({ id2: '34' });
    t2 = postTA.t.wrap({ id: '32' }).wrap({ id: '33' }).wrap({ id2: '34' });
  }
  const ta = mm.tableActions(user, UserTA);
  let v = ta.t;
  assert.ok(v instanceof mm.WrappedAction);
  assert.ok(v instanceof mm.Action);
  eq(v.actionType, mm.ActionType.wrap);
  eq(v.action, ta.s);
  assert.deepEqual(v.args, {
    id: '33',
    id2: '34',
  });
  eq(ta.s.__table, user);
  eq(v.__table, user);
  eq(v.isTemp, false);

  v = ta.t2;
  eq(v.action, postTA.t);
  eq(postTA.t.__table, post);
  eq(v.__table, user);
  eq(v.isTemp, false);
});

it('Uninitialized wrapped action __table n __name', () => {
  class UserTA extends mm.TableActions {
    t = mm.deleteOne().byID().wrap({ id: '23' });
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  eq(v.__table, user);
  eq(v.__name, 't');
  eq(v.isTemp, true);
});

it('Uninitialized wrapped action __table n __name (with from)', () => {
  class UserTA extends mm.TableActions {
    t = mm.deleteOne().from(post).byID().wrap({ id: '23' });
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  eq(v.__table, post);
  eq(v.__name, 't');
  eq(v.isTemp, true);
});

it('ValueRef', () => {
  const v = new mm.ValueRef('a');
  eq(v.firstName, 'a');
});

it('mm.valueRef', () => {
  const v = mm.valueRef('a');
  eq(v.firstName, 'a');
});

it('wrapAsRefs', () => {
  class UserTA extends mm.TableActions {
    t = mm.deleteOne().from(post).byID().wrapAsRefs({ id: '23', id2: 'abc' });
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  assert.deepEqual(v.args, {
    id: new mm.ValueRef('23'),
    id2: new mm.ValueRef('abc'),
  });
});
