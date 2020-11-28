import * as mm from '../..';
import user from '../models/user';
import post from '../models/post';
import { eq, ok, deepEq } from '../assert-aliases';

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

    t3 = mm.updateOne().from(post).setInputs().by(post.id).wrap({ title: '"t3"' });
  }
  const ta = mm.tableActions(user, UserTA);
  let v = ta.t;
  ok(v instanceof mm.WrapAction);
  ok(v instanceof mm.Action);
  eq(v.__name, 't');
  eq(v.actionType, mm.ActionType.wrap);
  eq(v.action, ta.s);
  eq(v.action.__name, 's');
  eq(v.action.__groupTable, user);
  eq(v.action.__sqlTable, null);
  eq(v.action, ta.s);
  eq(v.__sqlTable, null);
  eq(v.__groupTable, user);
  deepEq(v.args, {
    id: '1',
  });

  v = ta.t2;
  eq(v.__name, 't2');
  eq(v.action, postTA.t);
  eq(v.__sqlTable, null);
  eq(v.__groupTable, user);
  deepEq(v.args, {
    id: '32',
  });

  v = ta.t3;
  eq(v.__name, 't3');
  eq(v.action.__name, null);
  eq(v.action.__groupTable, null);
  eq(v.action.__sqlTable, post);
  eq(v.__sqlTable, null);
  eq(v.__groupTable, user);
  deepEq(v.args, {
    title: '"t3"',
  });
});

it('Wrap (chains)', () => {
  class PostTA extends mm.TableActions {
    t = mm.insert().setInputs(post.title, post.snake_case_user_id).setInputs();
  }
  const postTA = mm.tableActions(post, PostTA);
  class UserTA extends mm.TableActions {
    s = mm.deleteOne().by(post.id).from(post);
    t = this.s.wrap({ id: '32' }).wrap({ id: '33' }).wrap({ id2: '34' });
    t2 = postTA.t.wrap({ id: '32' }).wrap({ id: '33' }).wrap({ id2: '34' });
  }
  const ta = mm.tableActions(user, UserTA);
  let v = ta.t;
  ok(v instanceof mm.WrapAction);
  ok(v instanceof mm.Action);
  eq(v.actionType, mm.ActionType.wrap);
  eq(v.action, ta.s);
  deepEq(v.args, {
    id: '33',
    id2: '34',
  });
  eq(ta.s.__groupTable, user);
  eq(ta.s.__sqlTable, post);
  eq(v.__groupTable, user);
  eq(v.__sqlTable, null);
  eq(v.action, ta.s);

  v = ta.t2;
  eq(v.__groupTable, user);
  eq(v.__sqlTable, null);
  eq(v.action, postTA.t);
  eq(v.action.__sqlTable, null);
  eq(v.action.__groupTable, post);
});

it('Inline WRAP actions', () => {
  class UserTA extends mm.TableActions {
    t = mm.deleteOne().by(user.id).wrap({ id: '23' });
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  eq(v.__sqlTable, null);
  eq((v as mm.WrapAction).action.__sqlTable, null);
  eq((v as mm.WrapAction).action.__name, null);
  eq(v.__groupTable, user);
  eq(v.__name, 't');
  deepEq(v.args, { id: '23' });
});

it('Inline WRAP actions (chaining)', () => {
  class UserTA extends mm.TableActions {
    t = mm.deleteOne().by(user.id).wrap({ id: '23' }).wrap({ s: 'name' });
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  eq(v.__sqlTable, null);
  eq((v as mm.WrapAction).action.__groupTable, null);
  eq((v as mm.WrapAction).action.__sqlTable, null);
  eq((v as mm.WrapAction).action.__name, null);
  eq(v.__groupTable, user);
  eq(v.__name, 't');
  deepEq(v.args, { id: '23', s: 'name' });
});

it('Inline WRAP actions (with from)', () => {
  class UserTA extends mm.TableActions {
    t = mm.deleteOne().from(post).by(user.id).wrap({ id: '23' });
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  eq(v.__sqlTable, null);
  eq((v as mm.WrapAction).action.__groupTable, null);
  eq((v as mm.WrapAction).action.__sqlTable, post);
  eq((v as mm.WrapAction).action.__name, null);
  eq(v.__groupTable, user);
  eq(v.__name, 't');
  deepEq(v.args, { id: '23' });
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
  deepEq(v.args, {
    id: new mm.ValueRef('23'),
    id2: new mm.ValueRef('abc'),
  });
});
