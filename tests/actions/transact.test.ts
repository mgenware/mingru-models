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
  expect(postTA.batch2.actions).toEqual([
    postTA.insert,
    userTA.insert,
    postTA.batch,
  ]);
});

// test('getInputs', () => {
//   class UserTA extends dd.TA {
//     insert = dd.insert().setInputs(user.follower_count);
//   }
//   const userTA = dd.ta(user, UserTA);

//   class PostTA extends dd.TA {
//     insert = dd.insert().setInputs(post.title, post.snake_case_user_id);
//     update = dd
//       .updateOne()
//       .setInputs(post.e_user_id_n)
//       .byID();
//     batch = dd.transact(this.insert, userTA.insert, this.update);
//     batch2 = dd.transact(this.insert, userTA.insert, this.batch);
//   }
//   const postTA = dd.ta(post, PostTA);
//   const v = postTA.batch2;
//   expect(v.getInputs().list).toEqual(
//     [
//       post.title,
//       post.snake_case_user_id,
//       user.follower_count,
//       post.id,
//       post.e_user_id_n,
//     ].map(i => i.toInput()),
//   );
// });
