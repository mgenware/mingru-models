import * as mm from '../../';
import post from './post';
import cmt from './cmt';

export class PostCmtAss extends mm.Table {
  post_id = mm.pk(post.id);
  cmt_id = mm.pk(cmt.id);
}

export default mm.table(PostCmtAss);
