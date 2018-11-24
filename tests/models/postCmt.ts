import * as dd from '../../';
import user from './user';
import post from './post';

class PostCmt extends dd.Table {
  id = dd.pk();
  user_id = user.id;
  post_id = post.id;
}

export default dd.table(PostCmt);
