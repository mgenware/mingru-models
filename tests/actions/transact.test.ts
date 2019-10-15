import * as mm from '../../';
import user from '../models/user';
import post from '../models/post';
import { WrappedAction } from '../../';
import * as assert from 'assert';

const expect = assert.equal;
const ok = assert.ok;

it('Transact', () => {
  class UserTA extends mm.TableActions {
    insert = mm
      .insert()
      .setInputs(user.follower_count)
      .setInputs();
  }
  const userTA = mm.ta(user, UserTA);

  class PostTA extends mm.TableActions {
    insert = mm
      .insert()
      .setInputs(post.title, post.snake_case_user_id)
      .setInputs();
    update = mm
      .updateOne()
      .setInputs(post.e_user_id_n)
      .byID();
    batch = mm.transact(this.insert, userTA.insert, this.update);
    batch2 = mm.transact(this.insert, userTA.insert, this.batch);
  }
  const postTA = mm.ta(post, PostTA);

  let v = postTA.batch;
  expect(v.actionType, mm.ActionType.transact);
  ok(v instanceof mm.TransactAction);
  ok(v instanceof mm.Action);

  v = postTA.batch2;
  assert.deepEqual(
    v.members,
    [postTA.insert, userTA.insert, postTA.batch].map(
      m => new mm.TransactionMember(m),
    ),
  );
});

it('Temp member actions (wrap self)', async () => {
  class User2 extends mm.Table {
    id = mm.pk();
    postCount = mm.int();
  }
  const user2 = mm.table(User2);
  class User2TA extends mm.TableActions {
    updatePostCount = mm
      .updateOne()
      .set(
        user2.postCount,
        mm.sql`${user2.postCount} + ${mm.input(mm.int(), 'offset')}`,
      )
      .byID();
    t = mm.transact(this.updatePostCount.wrap({ offset: 1 }));
  }
  const user2TA = mm.ta(user2, User2TA);
  const v = user2TA.t;
  const wrapped = v.members[0].action as WrappedAction;
  expect(wrapped.action, user2TA.updatePostCount);
  assert.deepEqual(wrapped.args, { offset: 1 });
});

it('Temp member actions (wrap other)', async () => {
  class User2 extends mm.Table {
    id = mm.pk();
    postCount = mm.int();
  }
  const user2 = mm.table(User2);
  class User2TA extends mm.TableActions {
    updatePostCount = mm
      .updateOne()
      .set(
        user2.postCount,
        mm.sql`${user2.postCount} + ${mm.input(mm.int(), 'offset')}`,
      )
      .byID();
  }
  const user2TA = mm.ta(user2, User2TA);
  class Post2 extends mm.Table {
    id = mm.pk();
    title = mm.varChar(200);
  }

  const post2 = mm.table(Post2);
  class Post2TA extends mm.TableActions {
    insert = mm.transact(user2TA.updatePostCount.wrap({ offset: 1 }));
  }
  const postTA = mm.ta(post2, Post2TA);
  const v = postTA.insert;
  const wrapped = v.members[0].action as WrappedAction;
  expect(wrapped.action, user2TA.updatePostCount);
  assert.deepEqual(wrapped.args, { offset: 1 });
});

it('Setting __table or temp members', () => {
  class UserTA extends mm.TableActions {
    insert = mm
      .insert()
      .setInputs(user.follower_count)
      .setInputs();
  }
  const userTA = mm.ta(user, UserTA);

  class PostTA extends mm.TableActions {
    insert = mm
      .insert()
      .setInputs(post.title, post.snake_case_user_id)
      .setInputs();
    t = mm.transact(
      this.insert,
      userTA.insert,
      this.insert.wrap({ title: 'title' }),
      mm.insert().setDefaults(),
    );
  }
  const postTA = mm.ta(post, PostTA);
  const members = postTA.t.members;
  expect(members[0].action.__table, post);
  expect(members[0].action.__name, 'insert');
  expect(members[0].isTemp, false);
  expect(members[1].action.__table, user);
  expect(members[1].action.__name, 'insert');
  expect(members[1].isTemp, false);
  expect(members[2].action.__table, post);
  expect(members[2].action.__name, 'tChild2');
  expect(members[2].isTemp, true);
  expect(members[3].action.__table, post);
  expect(members[3].action.__name, 'tChild3');
  expect(members[3].isTemp, true);
});
