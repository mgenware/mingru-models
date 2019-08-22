import * as dd from '../../';
import user from '../models/user';
import * as assert from 'assert';

const expect = assert.equal;

class ABCTable extends dd.Table {
  StatusString = dd.varChar(10);
  statusType = dd.varChar(10);
  statusID = dd.int().setDBName('customName');
  uid1 = user.id;
  uid2 = user.id;
  uid3 = dd.fk(user.id).setDBName('UID3');
}

class DEFTable extends dd.Table {
  id = dd.pk();
}

const abcTable = dd.table(ABCTable);
const defTable = dd.table(DEFTable, 't');

it('Table name and getDBName', () => {
  expect(abcTable.__name, 'abc_table');
  expect(abcTable.getDBName(), 'abc_table');
  expect(defTable.__name, 'def_table');
  expect(defTable.__dbName, 't');
  expect(defTable.getDBName(), 't');
  expect(abcTable.StatusString.__name, 'status_string');
  expect(abcTable.statusType.__name, 'status_type');
  expect(abcTable.statusID.__name, 'status_id');
  expect(abcTable.statusID.__dbName, 'customName');
});

it('col.TableName(dbName)', () => {
  expect(defTable.id.tableName(), 'def_table');
  expect(defTable.id.tableName(true), 't');
});

it('Rename a FK', () => {
  expect(abcTable.uid1.__name, 'uid_1');
  expect(abcTable.uid1.__dbName, null);
  expect(abcTable.uid1.getDBName(), 'uid_1');
  expect(abcTable.uid2.__name, 'uid_2');
  expect(abcTable.uid2.__dbName, null);
  expect(abcTable.uid2.getDBName(), 'uid_2');
  expect(abcTable.uid3.__name, 'uid_3');
  expect(abcTable.uid3.__dbName, 'UID3');
  expect(abcTable.uid3.getDBName(), 'UID3');
});
