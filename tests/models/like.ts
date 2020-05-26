import * as mm from '../..';
import user from './user';

class Like extends mm.Table {
  user_id = mm.pk(user.id);
  type = mm.pk(mm.uInt()).noAutoIncrement;
  value = mm.bool();
}

export default mm.table(Like);
