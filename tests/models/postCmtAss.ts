import * as mm from '../../dist/main.js';
import post from './post.js';
import cmt from './cmt.js';

export class PostCmtAss extends mm.Table {
  post_id = mm.pk(post.id);
  cmt_id = mm.pk(cmt.id);
}

export default mm.table(PostCmtAss);
