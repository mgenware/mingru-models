/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as mm from '../../dist/main.js';
import user from '../models/user.js';
import post from '../models/post.js';
import { eq, ok, deepEq } from '../assert-aliases.js';

it('Wrap', () => {
  class PostTA extends mm.ActionGroup {
    t = mm.insert().setParams(post.title, post.snake_case_user_id).setParams();
  }
  const postTA = mm.actionGroup(post, PostTA);
  class UserTA extends mm.ActionGroup {
    s = mm.deleteOne().by(user.id);
    t2 = postTA.t.wrap({ id: '32' });

    t = this.s.wrap({
      id: '1',
      offset: -2,
    });

    t3 = mm.updateOne().from(post).setParams().by(post.id).wrap({ title: '"t3"' });
  }
  const ta = mm.actionGroup(user, UserTA);
  let v = ta.t;
  ok(v instanceof mm.WrapAction);
  ok(v instanceof mm.Action);
  eq(v.toString(), 'WrapAction(t, t=User(user))');
  const ad = v.__getData();
  const innerAction = ad.innerAction!;
  const bd = innerAction.__getData();
  eq(ad.name, 't');
  eq(ad.actionType, mm.ActionType.wrap);
  eq(innerAction, ta.s);
  eq(bd.name, 's');
  eq(bd.actionGroup, ta);
  eq(bd.sqlTable, undefined);
  eq(ad.sqlTable, undefined);
  eq(ad.actionGroup, ta);
  deepEq(ad.args, {
    id: '1',
    offset: -2,
  });

  v = ta.t2;
  const cd = v.__getData();
  eq(cd.name, 't2');
  eq(cd.innerAction, postTA.t);
  eq(cd.sqlTable, undefined);
  eq(cd.actionGroup, ta);
  deepEq(cd.args, {
    id: '32',
  });

  v = ta.t3;
  const dd = v.__getData();
  const ed = dd.innerAction!.__getData();
  eq(dd.name, 't3');
  eq(ed.name, 't3Core');
  eq(ed.actionGroup, ta);
  eq(ed.sqlTable, post);
  eq(dd.sqlTable, undefined);
  eq(dd.actionGroup, ta);
  deepEq(dd.args, {
    title: '"t3"',
  });
});

it('Wrap (chains)', () => {
  class PostTA extends mm.ActionGroup {
    t = mm.insert().setParams(post.title, post.snake_case_user_id).setParams();
  }
  const postTA = mm.actionGroup(post, PostTA);
  class UserTA extends mm.ActionGroup {
    s = mm.deleteOne().by(post.id).from(post);
    t = this.s.wrap({ id: '32' }).wrap({ id: '33' }).wrap({ id2: '34' });
    t2 = postTA.t.wrap({ id: '32' }).wrap({ id: '33' }).wrap({ id2: '34' });
  }
  const ta = mm.actionGroup(user, UserTA);
  let v = ta.t;
  let vd = v.__getData();
  ok(v instanceof mm.WrapAction);
  ok(v instanceof mm.Action);
  eq(vd.actionType, mm.ActionType.wrap);
  eq(vd.innerAction, ta.s);
  deepEq(vd.args, {
    id: '33',
    id2: '34',
  });
  eq(ta.s.__getData().actionGroup, ta);
  eq(ta.s.__getData().sqlTable, post);
  eq(vd.actionGroup, ta);
  eq(vd.sqlTable, undefined);

  v = ta.t2;
  vd = v.__getData();
  eq(vd.actionGroup, ta);
  eq(vd.sqlTable, undefined);
  eq(vd.innerAction, postTA.t);
  eq(vd.innerAction!.__getData().sqlTable, undefined);
  eq(vd.innerAction!.__getData().actionGroup, postTA);
});

it('Inline WRAP actions', () => {
  class UserTA extends mm.ActionGroup {
    t = mm.deleteOne().by(user.id).wrap({ id: '23' });
  }
  const ag = mm.actionGroup(user, UserTA);
  const v = ag.t;
  const vd = v.__getData();
  eq(vd.sqlTable, undefined);
  eq(vd.innerAction!.__getData().actionGroup, ag);
  eq(vd.innerAction!.__getData().sqlTable, undefined);
  eq(vd.innerAction!.__getData().name, 'tCore');
  eq(vd.actionGroup, ag);
  eq(vd.name, 't');
  deepEq(vd.args, { id: '23' });
});

it('Inline WRAP actions (chaining)', () => {
  class UserTA extends mm.ActionGroup {
    t = mm.deleteOne().by(user.id).wrap({ id: '23' }).wrap({ s: 'name' });
  }
  const ag = mm.actionGroup(user, UserTA);
  const v = ag.t;
  const vd = v.__getData();
  eq(vd.sqlTable, undefined);
  eq(vd.innerAction!.__getData().actionGroup, ag);
  eq(vd.innerAction!.__getData().sqlTable, undefined);
  eq(vd.innerAction!.__getData().name, 'tCore');
  eq(vd.actionGroup, ag);
  eq(vd.name, 't');
  deepEq(vd.args, { id: '23', s: 'name' });
});

it('Inline WRAP actions (with from)', () => {
  class UserTA extends mm.ActionGroup {
    t = mm.deleteOne().from(post).by(user.id).wrap({ id: '23' });
  }
  const ag = mm.actionGroup(user, UserTA);
  const v = ag.t;
  const vd = v.__getData();
  eq(vd.sqlTable, undefined);
  eq(vd.innerAction!.__getData().actionGroup, ag);
  eq(vd.innerAction!.__getData().sqlTable, post);
  eq(vd.innerAction!.__getData().name, 'tCore');
  eq(vd.actionGroup, ag);
  eq(vd.name, 't');
  deepEq(vd.args, { id: '23' });
});

it('ValueRef', () => {
  const v = new mm.CapturedVar('a');
  eq(v.firstName, 'a');
});

it('mm.valueRef', () => {
  const v = mm.captureVar('a');
  eq(v.firstName, 'a');
});

it('wrapAsRefs', () => {
  class UserTA extends mm.ActionGroup {
    t = mm.deleteOne().from(post).by(user.id).wrapAsRefs({ id: '23', id2: 'abc' });
  }
  const ta = mm.actionGroup(user, UserTA);
  const v = ta.t;
  const vd = v.__getData();
  deepEq(vd.args, {
    id: new mm.CapturedVar('23'),
    id2: new mm.CapturedVar('abc'),
  });
});
