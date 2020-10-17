import * as assert from 'assert';
import * as mm from '../..';
import user from '../models/user';
import employee from '../models/employee';
import like from '../models/like';

const eq = assert.equal;

it('Table name, DB name and input name', () => {
  eq(user.__name, 'user');
  eq(user.__dbName, null);
  eq(user.getDBName(), 'user');
  eq(user.inputName(), 'user');
  eq(user.toString(), 'Table(user)');

  class MyTable extends mm.Table {
    id = mm.pk();
  }
  const myTable = mm.table(MyTable, 'my_table');
  eq(myTable.__name, 'my_table');
  eq(myTable.__dbName, 'my_table');
  eq(myTable.getDBName(), 'my_table');
  eq(myTable.inputName(), 'myTable');
  eq(myTable.toString(), 'Table(my_table)');
});

it('enumerateColumns', () => {
  assert.deepEqual(user.__columns, {
    id: user.id,
    name: user.name,
    snake_case_name: user.snake_case_name,
    follower_count: user.follower_count,
    def_value: user.def_value,
  });
});

it('__pks', () => {
  assert.deepEqual(user.__pks, [user.id]);
  assert.deepEqual(user.__aiPKs, [user.id]);
  assert.deepEqual(employee.__pks, [employee.id]);
  assert.deepEqual(employee.__aiPKs, []);

  class Employee2 extends mm.Table {
    id = mm.pk(mm.int()).setDBName('emp_no').autoIncrement;
    firstName = mm.varChar(50);
  }
  const emp2 = mm.table(Employee2, 'employees');
  assert.deepEqual(emp2.__pks, [emp2.id]);
  assert.deepEqual(emp2.__aiPKs, [emp2.id]);
});

it('Composite PKs', () => {
  assert.deepEqual(like.__pks, [like.user_id, like.type]);
  assert.deepEqual(like.__aiPKs, []);
});

it('__actions and props', () => {
  assert.deepEqual(user.__columns, {
    id: user.id,
    name: user.name,
    snake_case_name: user.snake_case_name,
    follower_count: user.follower_count,
    def_value: user.def_value,
  });
  for (const [prop, column] of Object.entries(user.__columns)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eq((user as any)[prop], column);
  }
});

it('__actions and props (tableCore)', () => {
  const id = mm.pk();
  const name = mm.varChar(250);
  const table = mm.tableCore('A', 'a_a', null, { id, name });
  eq(table.__name, 'a');
  eq(table.__dbName, 'a_a');
  eq(table instanceof mm.Table, true);
  assert.deepEqual(table.__pks, [id]);
  assert.deepEqual(table.__aiPKs, [id]);
  assert.deepEqual(table.__columns, { id, name });
  for (const [prop, column] of Object.entries(table.__columns)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eq((table as any)[prop], column);
  }
});
