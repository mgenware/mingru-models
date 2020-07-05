import * as assert from 'assert';
import * as mm from '../..';
import user from '../models/user';
import employee from '../models/employee';
import like from '../models/like';

const expect = assert.equal;

it('Table name, DB name and input name', () => {
  expect(user.__name, 'user');
  expect(user.__dbName, null);
  expect(user.getDBName(), 'user');
  expect(user.inputName(), 'user');
  expect(user.toString(), 'Table(user)');

  class MyTable extends mm.Table {
    id = mm.pk();
  }
  const myTable = mm.table(MyTable, 'my_table');
  expect(myTable.__name, 'my_table');
  expect(myTable.__dbName, 'my_table');
  expect(myTable.getDBName(), 'my_table');
  expect(myTable.inputName(), 'myTable');
  expect(myTable.toString(), 'Table(my_table)');
});

it('enumerateColumns', () => {
  const cols: mm.Column[] = [];
  mm.enumerateColumns(user, (col) => cols.push(col));
  assert.deepEqual(cols, [
    user.id,
    user.name,
    user.snake_case_name,
    user.follower_count,
    user.def_value,
  ]);
});

it('enumerateColumns (sorted)', () => {
  const cols: mm.Column[] = [];
  mm.enumerateColumns(user, (col) => cols.push(col), { sorted: true });
  assert.deepEqual(cols, [
    user.def_value,
    user.follower_count,
    user.id,
    user.name,
    user.snake_case_name,
  ]);
});

it('__pks', () => {
  assert.deepEqual(user.__pks, [user.id]);
  assert.deepEqual(user.__pkAIs, [user.id]);
  assert.deepEqual(employee.__pks, [employee.id]);
  assert.deepEqual(employee.__pkAIs, []);

  class Employee2 extends mm.Table {
    id = mm.pk(mm.int()).setDBName('emp_no').autoIncrement;
    firstName = mm.varChar(50);
  }
  const emp2 = mm.table(Employee2, 'employees');
  assert.deepEqual(emp2.__pks, [emp2.id]);
  assert.deepEqual(emp2.__pkAIs, [emp2.id]);
});

it('Composite PKs', () => {
  assert.deepEqual(like.__pks, [like.user_id, like.type]);
  assert.deepEqual(like.__pkAIs, []);
});

it('tableCore', () => {
  const id = mm.pk();
  const name = mm.varChar(250);
  const table = mm.tableCore('A', 'a_a', null, [
    ['id', id],
    ['name', name],
  ]);
  expect(table.__name, 'a');
  expect(table.__dbName, 'a_a');
  assert.deepEqual(table.__pks, [id]);
  assert.deepEqual(table.__pkAIs, [id]);
  assert.deepEqual(table.__columns, [id, name]);
});
