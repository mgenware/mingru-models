import * as assert from 'assert';
import * as mm from '../..';
import user from '../models/user';
import post from '../models/post';
import { WrappedAction } from '../..';

const eq = assert.equal;

it('Transact', () => {
  class UserTA extends mm.TableActions {
    insert = mm.insert().setInputs(user.follower_count).setInputs();
  }
  const userTA = mm.tableActions(user, UserTA);

  class PostTA extends mm.TableActions {
    insert = mm.insert().setInputs(post.title, post.snake_case_user_id).setInputs();

    update = mm.updateOne().setInputs(post.e_user_id_n).byID();
    batch = mm.transact(this.insert, userTA.insert, this.update);
    batch2 = mm.transact(this.insert, userTA.insert, this.batch);
  }
  const postTA = mm.tableActions(post, PostTA);

  let v = postTA.batch;
  eq(v.actionType, mm.ActionType.transact);
  assert.ok(v instanceof mm.TransactAction);
  assert.ok(v instanceof mm.Action);

  v = postTA.batch2;
  assert.deepEqual(
    v.members,
    [postTA.insert, userTA.insert, postTA.batch].map(
      (m) => new mm.TransactionMember(m, undefined, undefined),
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
      .set(user2.postCount, mm.sql`${user2.postCount} + ${mm.input(mm.int(), 'offset')}`)
      .byID();

    t = mm.transact(this.updatePostCount.wrap({ offset: '1' }));
  }
  const user2TA = mm.tableActions(user2, User2TA);
  const v = user2TA.t;
  const wrapped = v.members[0].action as WrappedAction;
  eq(wrapped.action, user2TA.updatePostCount);
  assert.deepEqual(wrapped.args, { offset: '1' });
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
      .set(user2.postCount, mm.sql`${user2.postCount} + ${mm.input(mm.int(), 'offset')}`)
      .byID();
  }
  const user2TA = mm.tableActions(user2, User2TA);
  class Post2 extends mm.Table {
    id = mm.pk();
    title = mm.varChar(200);
  }

  const post2 = mm.table(Post2);
  class Post2TA extends mm.TableActions {
    insert = mm.transact(user2TA.updatePostCount.wrap({ offset: '1' }));
  }
  const postTA = mm.tableActions(post2, Post2TA);
  const v = postTA.insert;
  const wrapped = v.members[0].action as WrappedAction;
  eq(wrapped.action, user2TA.updatePostCount);
  assert.deepEqual(wrapped.args, { offset: 1 });
});

it('Setting __table or temp members', () => {
  class UserTA extends mm.TableActions {
    insert = mm.insert().setInputs(user.follower_count).setInputs();
  }
  const userTA = mm.tableActions(user, UserTA);

  class PostTA extends mm.TableActions {
    insert = mm.insert().setInputs(post.title, post.snake_case_user_id).setInputs();

    t = mm.transact(
      mm.insert().setDefaults(),
      this.insert,
      userTA.insert,
      this.insert.wrap({ title: 'title' }),
    );
  }
  const postTA = mm.tableActions(post, PostTA);
  const { members } = postTA.t;
  eq(members[0].action.__table, post);
  eq(members[0].action.__name, 'tChild1');
  eq(members[0].isTemp, true);
  eq(members[1].action.__table, post);
  eq(members[1].action.__name, 'insert');
  eq(members[1].isTemp, false);
  eq(members[2].action.__table, user);
  eq(members[2].action.__name, 'insert');
  eq(members[2].isTemp, false);
  eq(members[3].action.__table, post);
  eq(members[3].action.__name, 'tChild4');
  eq(members[3].isTemp, true);
});

it('Declare returns', () => {
  class UserTA extends mm.TableActions {
    insert1 = mm.insert().setInputs();
    insert2 = mm.insert().setInputs();
  }
  const userTA = mm.tableActions(user, UserTA);

  class PostTA extends mm.TableActions {
    batch = mm
      .transact(
        userTA.insert1,
        userTA.insert2.declareReturnValues({ a: '_a' }),
        userTA.insert1.declareReturnValue('b', '_b'),
        userTA.insert1.declareInsertedID('i'),
      )
      .setReturnValues('_b', '_a');
  }
  const postTA = mm.tableActions(post, PostTA);

  const v = postTA.batch;
  assert.ok(v.members[0].returnValues === undefined);
  assert.deepEqual(v.members[1].returnValues, { a: '_a' });
  assert.deepEqual(v.members[2].returnValues, { b: '_b' });
  assert.deepEqual(v.members[3].returnValues, {
    [mm.ReturnValues.insertedID]: 'i',
  });
  assert.deepEqual(v.__returnValues, ['_b', '_a']);
});
