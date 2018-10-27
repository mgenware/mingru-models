import * as dd from '../..';
import user from './user';
import post from './post';

class Cmt extends dd.Table {
  id = dd.pk();
  user_id = dd.fk(user.id);
  post_id = dd.fk(post.id);
}

export default dd.table(Cmt);
