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
    s = mm.deleteOne().by(user.id);
    t2 = postTA.t.wrap({ id: '32' });

    t = this.s.wrap({
      id: '1',
    });
  }
  const ta = mm.tableActions(user, UserTA);
  let v = ta.t;
  assert.ok(v instanceof mm.WrapAction);
  assert.ok(v instanceof mm.Action);
  eq(v.actionType, mm.ActionType.wrap);
  eq(v.action, ta.s);
  eq(ta.s.__table, user);
  eq(v.__table, user);
  eq(v.__rootTable, user);
  assert.deepEqual(v.args, {
    id: '1',
  });

  v = ta.t2;
  eq(v.action, postTA.t);
  eq(postTA.t.__table, post);
  eq(postTA.t.__rootTable, post);
  eq(v.__table, user);
  eq(v.__rootTable, user);
  assert.deepEqual(v.args, {
    id: '32',
  });
});

it('Wrap (chains)', () => {
  class PostTA extends mm.TableActions {
    t = mm.insert().setInputs(post.title, post.snake_case_user_id).setInputs();
  }
  const postTA = mm.tableActions(post, PostTA);
  class UserTA extends mm.TableActions {
    s = mm.deleteOne().by(user.id);
    t = this.s.wrap({ id: '32' }).wrap({ id: '33' }).wrap({ id2: '34' });
    t2 = postTA.t.wrap({ id: '32' }).wrap({ id: '33' }).wrap({ id2: '34' });
  }
  const ta = mm.tableActions(user, UserTA);
  let v = ta.t;
  assert.ok(v instanceof mm.WrapAction);
  assert.ok(v instanceof mm.Action);
  eq(v.actionType, mm.ActionType.wrap);
  eq(v.action, ta.s);
  assert.deepEqual(v.args, {
    id: '33',
    id2: '34',
  });
  eq(ta.s.__table, user);
  eq(v.__table, user);
  eq((v as mm.WrapAction).action.__table, user);
  eq((v as mm.WrapAction).action.__name, 's');

  v = ta.t2;
  eq(v.action, postTA.t);
  eq(postTA.t.__table, post);
  eq(v.__table, user);
  eq((v as mm.WrapAction).action.__table, post);
  eq((v as mm.WrapAction).action.__name, 't');
});

it('Inline WRAP actions', () => {
  class UserTA extends mm.TableActions {
    t = mm.deleteOne().by(user.id).wrap({ id: '23' });
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  eq(v.__table, user);
  eq((v as mm.WrapAction).action.__table, user);
  eq((v as mm.WrapAction).action.__name, 't');
  eq(v.__rootTable, user);
  eq(v.__name, 't');
  assert.deepStrictEqual(v.args, { id: '23' });
});

it('Inline WRAP actions (chaining)', () => {
  class UserTA extends mm.TableActions {
    t = mm.deleteOne().by(user.id).wrap({ id: '23' }).wrap({ s: 'name' });
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  eq(v.__table, user);
  eq((v as mm.WrapAction).action.__table, user);
  eq((v as mm.WrapAction).action.__name, 't');
  eq(v.__rootTable, user);
  eq(v.__name, 't');
  assert.deepStrictEqual(v.args, { id: '23', s: 'name' });
});

it('Inline WRAP actions (with from)', () => {
  class UserTA extends mm.TableActions {
    t = mm.deleteOne().from(post).by(user.id).wrap({ id: '23' });
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  eq(v.__table, user);
  eq((v as mm.WrapAction).action.__table, post);
  eq((v as mm.WrapAction).action.__name, 't');
  eq(v.__rootTable, user);
  eq(v.__name, 't');
  assert.deepStrictEqual(v.args, { id: '23' });
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
    t = mm.deleteOne().from(post).by(user.id).wrapAsRefs({ id: '23', id2: 'abc' });
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  assert.deepEqual(v.args, {
    id: new mm.ValueRef('23'),
    id2: new mm.ValueRef('abc'),
  });
});
