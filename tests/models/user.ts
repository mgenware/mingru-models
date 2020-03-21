import * as mm from '../../';

class User extends mm.Table {
  id = mm.pk();
  name = mm.varChar(100);
  snake_case_name = mm.varChar(100);
  follower_count = mm.int().default(0);
  def_value = mm.varChar(20).default('abc');
}

export default mm.table(User);
