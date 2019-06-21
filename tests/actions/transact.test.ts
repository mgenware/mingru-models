import * as dd from '../../';
import user from '../models/user';
import post from '../models/post';

test('Transact', () => {
  class UserTA extends dd.TA {
    insert = dd.insert().setInputs(user.follower_count);
  }
  const userTA = dd.ta(user, UserTA);

  class PostTA extends dd.TA {
    insert = dd.insert().setInputs(post.title, post.snake_case_user_id);
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
