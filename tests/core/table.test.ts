import * as mm from '../../dist/main.js';
import user from '../models/user.js';
import employee from '../models/employee.js';
import like from '../models/like.js';
import { eq, deepEq } from '../assert-aliases.js';

it('Core props', () => {
  const d = user.__getData();
  eq(d.name, 'user');
  eq(d.dbName, undefined);
  eq(user.__getDBName(), 'user');
  eq(user.__getModelName(), 'user');
  eq(user.toString(), 'User(user)');
  eq(d.virtualTable, false);

  class MyTable extends mm.Table {
    id = mm.pk();
  }
  const myTable = mm.table(MyTable, { dbName: 'my_table' });
  const d2 = myTable.__getData();
  eq(d2.name, 'my_table');
  eq(d2.dbName, 'my_table');
  eq(myTable.__getDBName(), 'my_table');
  eq(myTable.__getModelName(), 'my_table');
  eq(myTable.toString(), 'MyTable(my_table, db=my_table)');
});

it('enumerateColumns', () => {
  deepEq(user.__getData().columns, {
    id: user.id,
    name: user.name,
    snake_case_name: user.snake_case_name,
    follower_count: user.follower_count,
    def_value: user.def_value,
  });
});

it('__pks', () => {
  const userD = user.__getData();
  deepEq(userD.pks, [user.id]);
  deepEq(userD.aiPKs, [user.id]);

  const employeeD = employee.__getData();
  deepEq(employeeD.pks, [employee.id]);
  deepEq(employeeD.aiPKs, []);

  class Employee2 extends mm.Table {
    id = mm.pk(mm.int()).setDBName('emp_no').autoIncrement;
    firstName = mm.varChar(50);
  }
  const emp2 = mm.table(Employee2, { dbName: 'employees' });
  const emp2D = emp2.__getData();
  deepEq(emp2D.pks, [emp2.id]);
  deepEq(emp2D.aiPKs, [emp2.id]);
});

it('Composite PKs', () => {
  const d = like.__getData();
  deepEq(d.pks, [like.user_id, like.type]);
  deepEq(d.aiPKs, []);
});

it('__columns', () => {
  deepEq(user.__getData().columns, {
    id: user.id,
    name: user.name,
    snake_case_name: user.snake_case_name,
    follower_count: user.follower_count,
    def_value: user.def_value,
  });
  for (const [prop, column] of Object.entries(user.__getData().columns)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eq((user as any)[prop], column);
  }
});

it('tableCore', () => {
  const id = mm.pk();
  const name = mm.varChar(250);
  const table = mm.tableCore('A', undefined, { id, name }, { dbName: 'a_a' });
  const d = table.__getData();
  eq(d.name, 'a');
  eq(d.dbName, 'a_a');
  eq(table instanceof mm.Table, true);
  deepEq(d.pks, [id]);
  deepEq(d.aiPKs, [id]);
  deepEq(d.columns, { id, name });
  for (const [prop, column] of Object.entries(d.columns)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eq((table as any)[prop], column);
  }
});

it('Virtual table', () => {
  class VT extends mm.Table {}
  const vt = mm.table(VT, { virtualTable: true });
  eq(vt.__getData().virtualTable, true);
});
