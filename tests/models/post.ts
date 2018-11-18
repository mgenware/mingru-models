import * as dd from '../../';
import user from './user';

class Post extends dd.Table {
  id = dd.pk();
  user_id = user.id;
}

export default dd.table(Post);
