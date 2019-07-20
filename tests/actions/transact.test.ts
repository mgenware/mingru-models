import * as dd from '../../';
import user from '../models/user';
import post from '../models/post';
import { WrappedAction } from '../../';

test('Transact', () => {
  class UserTA extends dd.TA {
    insert = dd
      .insert()
      .setInputs(user.follower_count)
      .setInputs();
  }
  const userTA = dd.ta(user, UserTA);

  class PostTA extends dd.TA {
    insert = dd
      .insert()
      .setInputs(post.title, post.snake_case_user_id)
      .setInputs();
    update = dd
      .updateOne()
      .setInputs(post.e_user_id_n)
      .byID();
    batch = dd.transact(this.insert, userTA.insert, this.update);
    batch2 = dd.transact(this.insert, userTA.insert, this.batch);
  }
  const postTA = dd.ta(post, PostTA);

  let v = postTA.batch;
  expect(v.actionType).toBe(dd.ActionType.transact);
  expect(v).toBeInstanceOf(dd.TransactAction);
  expect(v).toBeInstanceOf(dd.Action);

  v = postTA.batch2;
  expect(v.members).toEqual(
    [postTA.insert, userTA.insert, postTA.batch].map(
      m => new dd.TransactionMember(m),
    ),
  );
});

test('Temp member actions (wrap self)', async () => {
  class User2 extends dd.Table {
    id = dd.pk();
    postCount = dd.int();
  }
  const user2 = dd.table(User2);
  class User2TA extends dd.TA {
    updatePostCount = dd
      .updateOne()
      .set(
        user2.postCount,
        dd.sql`${user2.postCount} + ${dd.input(dd.int(), 'offset')}`,
      )
      .byID();
    t = dd.transact(this.updatePostCount.wrap({ offset: 1 }));
  }
  const user2TA = dd.ta(user2, User2TA);
  const v = user2TA.t;
  const wrapped = v.members[0].action as WrappedAction;
  expect(wrapped.__table).toBe(user2);
  expect(wrapped.__name).toBe('updatePostCount');
  expect(wrapped.action).toBe(user2TA.updatePostCount);
  expect(wrapped.args).toEqual({ offset: 1 });
});

test('Temp member actions (wrap other)', async () => {
  class User2 extends dd.Table {
    id = dd.pk();
    postCount = dd.int();
  }
  const user2 = dd.table(User2);
  class User2TA extends dd.TA {
    updatePostCount = dd
      .updateOne()
      .set(
        user2.postCount,
        dd.sql`${user2.postCount} + ${dd.input(dd.int(), 'offset')}`,
      )
      .byID();
  }
  const user2TA = dd.ta(user2, User2TA);
  class Post2 extends dd.Table {
    id = dd.pk();
    title = dd.varChar(200);
  }

  const post2 = dd.table(Post2);
  class Post2TA extends dd.TA {
    insert = dd.transact(user2TA.updatePostCount.wrap({ offset: 1 }));
  }
  const postTA = dd.ta(post2, Post2TA);
  const v = postTA.insert;
  const wrapped = v.members[0].action as WrappedAction;
  expect(wrapped.__table).toBe(user2);
  expect(wrapped.__name).toBe('updatePostCount');
  expect(wrapped.action).toBe(user2TA.updatePostCount);
  expect(wrapped.args).toEqual({ offset: 1 });
});
