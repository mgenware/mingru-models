import * as dd from '../..';

class User extends dd.Table {
  id = dd.pk();
  name = dd.varChar(100);
  follower_count = dd.int(0);
}

export default dd.table(User);
