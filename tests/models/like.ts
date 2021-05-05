import * as mm from '../../dist/main.js';
import user from './user.js';

class Like extends mm.Table {
  user_id = mm.pk(user.id);
  type = mm.pk(mm.uInt()).noAutoIncrement;
  value = mm.bool();
}

export default mm.table(Like);
