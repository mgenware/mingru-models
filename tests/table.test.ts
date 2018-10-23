import * as dd from '..';

class User extends dd.Table {
  id = dd.pk();
  name = dd.varChar(100);
}

const user = dd.table(User);

test('table', () => {
  expect(user.TableName).toBe('user');
});
