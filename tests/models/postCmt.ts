import * as mm from '../../dist/main.js';
import user from './user.js';
import post from './post.js';

class PostCmt extends mm.Table {
  id = mm.pk();
  user_id = user.id;
  post_id = post.id;
  snake_case_post_id = post.id;
}

export default mm.table(PostCmt);
