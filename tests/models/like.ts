import * as dd from '../../';
import user from './user';

class Like extends dd.Table {
  user_id = dd.pk(user.id);
  type = dd.pk(dd.uInt()).noAutoIncrement;
  value = dd.bool();
}

export default dd.table(Like);
