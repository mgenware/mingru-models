import * as dd from '../..';

class User extends dd.Table {
  id = dd.pk();
  name = dd.varChar(100);
}

export default dd.table(User);
