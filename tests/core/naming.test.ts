import * as dd from '../../';
import user from '../models/user';

class ABCTable extends dd.Table {
  StatusString = dd.varChar(10);
  statusType = dd.varChar(10);
  statusID = dd.int().setDBName('customName');
  uid1 = user.id;
  uid2 = user.id;
  uid3 = dd.fk(user.id).setDBName('UID3');
}

class DEFTable extends dd.Table {}

const abcTable = dd.table(ABCTable);
const defTable = dd.table(DEFTable, 't');

test('Capitalized to snake_case', () => {
  expect(abcTable.__name).toBe('abc_table');
  expect(defTable.__name).toBe('t');
  expect(abcTable.StatusString.name).toBe('status_string');
  expect(abcTable.statusType.name).toBe('status_type');
  expect(abcTable.statusID.name).toBe('status_id');
  expect(abcTable.statusID.dbName).toBe('customName');
});

test('Rename a FK', () => {
  expect(abcTable.uid1.name).toBe('uid_1');
  expect(abcTable.uid1.dbName).toBe(null);
  expect(abcTable.uid2.name).toBe('uid_2');
  expect(abcTable.uid2.dbName).toBe(null);
  expect(abcTable.uid3.name).toBe('uid_3');
  expect(abcTable.uid3.dbName).toBe('UID3');
});
