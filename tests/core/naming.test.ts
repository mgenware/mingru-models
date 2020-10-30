import * as assert from 'assert';
import * as mm from '../..';
import user from '../models/user';

const eq = assert.equal;

class ABCTable extends mm.Table {
  StatusString = mm.varChar(10);
  statusType = mm.varChar(10);
  statusID = mm.int().setDBName('customName');
  uid1 = user.id;
  uid2 = user.id;
  uid3 = mm.fk(user.id).setDBName('UID3').setModelName('ModelNAME');
}

class DEFTable extends mm.Table {
  id = mm.pk();
}

const abcTable = mm.table(ABCTable);
const defTable = mm.table(DEFTable, 't');

it('Table name and getDBName', () => {
  eq(abcTable.__name, 'abc_table');
  eq(abcTable.getDBName(), 'abc_table');
  eq(defTable.__name, 'def_table');
  eq(defTable.__dbName, 't');
  eq(defTable.getDBName(), 't');
  eq(defTable.toString(), 'Table(def_table|t)');
  eq(abcTable.StatusString.__name, 'status_string');
  eq(abcTable.statusType.__name, 'status_type');
  eq(abcTable.statusID.__name, 'status_id');
  eq(abcTable.statusID.__dbName, 'customName');
});

it('Rename a FK', () => {
  eq(abcTable.uid1.__name, 'uid_1');
  eq(abcTable.uid1.__dbName, null);
  eq(abcTable.uid1.getDBName(), 'uid_1');
  eq(abcTable.uid2.__name, 'uid_2');
  eq(abcTable.uid2.__dbName, null);
  eq(abcTable.uid2.getDBName(), 'uid_2');
  eq(abcTable.uid3.__name, 'uid_3');
  eq(abcTable.uid3.__dbName, 'UID3');
  eq(abcTable.uid3.getDBName(), 'UID3');
  eq(abcTable.uid3.__modelName, 'ModelNAME');
  eq(abcTable.uid3.toString(), 'Column(uid_3|UID3, Table(abc_table))');
});
