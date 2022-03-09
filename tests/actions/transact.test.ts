/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as mm from '../../dist/main.js';
import user from '../models/user.js';
import post from '../models/post.js';
import { eq, ok, deepEq } from '../assert-aliases.js';

it('Transact', () => {
  class UserTA extends mm.TableActions {
    insert = mm.insert().setInputs(user.follower_count).setInputs();
  }
  const userTA = mm.tableActions(user, UserTA);

  class PostTA extends mm.TableActions {
    insert = mm.insert().setInputs(post.title, post.snake_case_user_id).setInputs();

    update = mm.updateOne().setInputs(post.e_user_id_n).by(post.id);
    batch = mm.transact(this.insert, userTA.insert, this.update);
    batch2 = mm.transact(this.insert, userTA.insert, this.batch);
  }
  const postTA = mm.tableActions(post, PostTA);

  let v = postTA.batch;
  let vd = v.__getData();
  eq(vd.actionType, mm.ActionType.transact);
  ok(v instanceof mm.TransactAction);
  ok(v instanceof mm.Action);
  eq(v.toString(), 'TransactAction(batch, t=Post(post))');

  v = postTA.batch2;
  vd = v.__getData();
  deepEq(
    vd.members,
    [postTA.insert, userTA.insert, postTA.batch].map(
      (m) => new mm.TransactionMember(m, undefined, undefined),
    ),
  );
});

it('Inline member actions (wrap self)', () => {
  class User2 extends mm.Table {
    id = mm.pk();
    postCount = mm.int();
  }
  const user2 = mm.table(User2);
  class User2TA extends mm.TableActions {
    updatePostCount = mm
      .updateOne()
      .set(user2.postCount, mm.sql`${user2.postCount} + ${mm.input(mm.int(), 'offset')}`)
      .by(user2.id);

    t = mm.transact(this.updatePostCount.wrap({ offset: '1' }));
  }
  const user2TA = mm.tableActions(user2, User2TA);
  const v = user2TA.t;
  const vd = v.__getData();
  const wrapped = vd.members![0]!.action as mm.WrapAction;
  eq(wrapped.__getData().innerAction, user2TA.updatePostCount);
  deepEq(wrapped.__getData().args, { offset: '1' });
});

it('Inline member actions (wrap other)', () => {
  class User2 extends mm.Table {
    id = mm.pk();
    postCount = mm.int();
  }
  const user2 = mm.table(User2);
  class User2TA extends mm.TableActions {
    updatePostCount = mm
      .updateOne()
      .set(user2.postCount, mm.sql`${user2.postCount} + ${mm.input(mm.int(), 'offset')}`)
      .by(user2.id);
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
  const vd = v.__getData();
  const wrapped = vd.members![0]!.action as mm.WrapAction;
  eq(wrapped.__getData().innerAction, user2TA.updatePostCount);
  deepEq(wrapped.__getData().args, { offset: '1' });
});

it('Setting __table or inline members', () => {
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
  const members = postTA.t.__getData().members!;
  eq(members[0]?.action.__getData().groupTable, undefined);
  eq(members[0]?.action.__getData().sqlTable, undefined);
  eq(members[0]?.action.__getData().name, undefined);
  eq(members[1]?.action.__getData().groupTable, post);
  eq(members[1]?.action.__getData().sqlTable, undefined);
  eq(members[1]?.action.__getData().name, 'insert');
  eq(members[2]?.action.__getData().groupTable, user);
  eq(members[2]?.action.__getData().sqlTable, undefined);
  eq(members[2]?.action.__getData().name, 'insert');
  eq(members[3]?.action.__getData().groupTable, undefined);
  eq(members[3]?.action.__getData().sqlTable, undefined);
  eq(members[3]?.action.__getData().name, undefined);
});

it('Declare return values', () => {
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
  const vd = v.__getData();
  const members = vd.members!;
  ok(members[0]!.returnValues === undefined);
  deepEq(members[1]!.returnValues, { a: '_a' });
  deepEq(members[2]!.returnValues, { b: '_b' });
  deepEq(members[3]!.returnValues, {
    [mm.ReturnValues.insertedID]: 'i',
  });
  deepEq(vd.returnValues, ['_b', '_a']);
});
