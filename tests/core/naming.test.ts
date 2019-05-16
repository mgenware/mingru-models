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
  expect(abcTable.getDBName()).toBe('abc_table');
  expect(defTable.__name).toBe('def_table');
  expect(defTable.__dbName).toBe('t');
  expect(defTable.getDBName()).toBe('t');
  expect(abcTable.StatusString.__name).toBe('status_string');
  expect(abcTable.statusType.__name).toBe('status_type');
  expect(abcTable.statusID.__name).toBe('status_id');
  expect(abcTable.statusID.__dbName).toBe('customName');
});

test('Rename a FK', () => {
  expect(abcTable.uid1.__name).toBe('uid_1');
  expect(abcTable.uid1.__dbName).toBe(null);
  expect(abcTable.uid1.getDBName()).toBe('uid_1');
  expect(abcTable.uid2.__name).toBe('uid_2');
  expect(abcTable.uid2.__dbName).toBe(null);
  expect(abcTable.uid2.getDBName()).toBe('uid_2');
  expect(abcTable.uid3.__name).toBe('uid_3');
  expect(abcTable.uid3.__dbName).toBe('UID3');
  expect(abcTable.uid3.getDBName()).toBe('UID3');
});
