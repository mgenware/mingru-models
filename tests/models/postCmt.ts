import * as mm from '../../';
import user from './user';
import post from './post';

class PostCmt extends mm.Table {
  id = mm.pk();
  user_id = user.id;
  post_id = post.id;
  snake_case_post_id = post.id;
}

export default mm.table(PostCmt);
