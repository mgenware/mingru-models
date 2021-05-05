import * as mm from '../../dist/main.js';
import user from './user.js';

class Post extends mm.Table {
  id = mm.pk();
  user_id = user.id;
  e_user_id = mm.fk(user.id);
  e_user_id_n = mm.fk(user.id).nullable;
  snake_case_user_id = user.id;
  title = mm.varChar(100);
}

export default mm.table(Post);
