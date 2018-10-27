import * as dd from '..';
import user from './models/user';
import post from './models/post';

test('Table and name', () => {
  // Normal col
  expect(post.id.__name).toBe('id');
  expect(post.id.__table).toBe(post);
  // FK
  expect(post.user_id.__name).toBe('user_id');
  expect(post.user_id.__table).toBe(post);
  const ref = (post.user_id as dd.ForeignColumn).ref;
  expect(ref.__name).toBe('id');
  expect(ref.__table).toBe(user);
});

test('Col types', () => {
  expect(user.id instanceof dd.Column).toBe(true);
  expect(post.user_id instanceof dd.ForeignColumn).toBe(true);
});

class DirectRefFK extends dd.Table {
  id = dd.pk();
  fk = user.id;
}

test('Throw on direct ref on foreign column', () => {
  const colName = 'fk';
  expect(() => dd.table(DirectRefFK)).toThrowError(`Error creating column "${colName}". It seems you are using a column from another table, please use the fk function to create foreign key column`);
});
