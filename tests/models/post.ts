import * as dd from '../../';
import user from './user';

class Post extends dd.Table {
  id = dd.pk();
  user_id = user.id;
  e_user_id = dd.fk(user.id);
  e_user_id_n = dd.fk(user.id).nullable;
  snake_case_user_id = user.id;
  title = dd.varChar(100);
}

export default dd.table(Post);
