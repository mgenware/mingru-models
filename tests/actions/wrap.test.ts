import * as mm from '../../';
import user from '../models/user';
import * as assert from 'assert';
import post from '../models/post';

const expect = assert.equal;
const ok = assert.ok;

it('Wrap', () => {
  class PostTA extends mm.TableActions {
    t = mm
      .insert()
      .setInputs(post.title, post.snake_case_user_id)
      .setInputs();
  }
  const postTA = mm.tableActions(post, PostTA);
  class UserTA extends mm.TableActions {
    s = mm.deleteOne().byID();
    t = this.s.wrap({
      id: '1',
    });
    t2 = postTA.t.wrap({ id: '32' });
  }
  const ta = mm.tableActions(user, UserTA);
  let v = ta.t;
  ok(v instanceof mm.WrappedAction);
  ok(v instanceof mm.Action);
  expect(v.actionType, mm.ActionType.wrap);
  expect(v.action, ta.s);
  assert.deepEqual(v.args, {
    id: '1',
  });
  expect(ta.s.__table, user);
  expect(v.__table, user);
  expect(v.isTemp, false);

  v = ta.t2;
  expect(v.action, postTA.t);
  expect(postTA.t.__table, post);
  expect(v.__table, user);
  expect(v.isTemp, false);
});

it('Wrap (chains)', () => {
  class PostTA extends mm.TableActions {
    t = mm
      .insert()
      .setInputs(post.title, post.snake_case_user_id)
      .setInputs();
  }
  const postTA = mm.tableActions(post, PostTA);
  class UserTA extends mm.TableActions {
    s = mm.deleteOne().byID();
    t = this.s
      .wrap({ id: '32' })
      .wrap({ id: '33' })
      .wrap({ id2: '34' });
    t2 = postTA.t
      .wrap({ id: '32' })
      .wrap({ id: '33' })
      .wrap({ id2: '34' });
  }
  const ta = mm.tableActions(user, UserTA);
  let v = ta.t;
  ok(v instanceof mm.WrappedAction);
  ok(v instanceof mm.Action);
  expect(v.actionType, mm.ActionType.wrap);
  expect(v.action, ta.s);
  assert.deepEqual(v.args, {
    id: '33',
    id2: '34',
  });
  expect(ta.s.__table, user);
  expect(v.__table, user);
  expect(v.isTemp, false);

  v = ta.t2;
  expect(v.action, postTA.t);
  expect(postTA.t.__table, post);
  expect(v.__table, user);
  expect(v.isTemp, false);
});

it('Uninitialized wrapped action __table n __name', () => {
  class UserTA extends mm.TableActions {
    t = mm
      .deleteOne()
      .byID()
      .wrap({ id: 23 });
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  expect(v.__table, user);
  expect(v.__name, 't');
  expect(v.isTemp, true);
});

it('Uninitialized wrapped action __table n __name (with from)', () => {
  class UserTA extends mm.TableActions {
    t = mm
      .deleteOne()
      .from(post)
      .byID()
      .wrap({ id: 23 });
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  expect(v.__table, post);
  expect(v.__name, 't');
  expect(v.isTemp, true);
});

it('ValueRef', () => {
  const v = new mm.ValueRef('a');
  expect(v.name, 'a');
});
