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
  eq(abcTable.__getData().name, 'abc_table');
  eq(abcTable.__getDBName(), 'abc_table');
  eq(defTable.__getData().name, 'def_table');
  eq(defTable.__getData().dbName, 't');
  eq(defTable.__getDBName(), 't');
  eq(defTable.toString(), 'Table(def_table|t)');
  eq(abcTable.StatusString.__getData().name, 'status_string');
  eq(abcTable.statusType.__getData().name, 'status_type');
  eq(abcTable.statusID.__getData().name, 'status_id');
  eq(abcTable.statusID.__getData().dbName, 'customName');
});

it('Rename a FK', () => {
  eq(abcTable.uid1.__getData().name, 'uid1');
  eq(abcTable.uid1.__getData().dbName, null);
  eq(abcTable.uid1.__getDBName(), 'uid1');
  eq(abcTable.uid2.__getData().name, 'uid2');
  eq(abcTable.uid2.__getData().dbName, null);
  eq(abcTable.uid2.__getDBName(), 'uid2');
  eq(abcTable.uid3.__getData().name, 'uid3');
  eq(abcTable.uid3.__getData().dbName, 'UID3');
  eq(abcTable.uid3.__getDBName(), 'UID3');
  eq(abcTable.uid3.__getData().modelName, 'ModelNAME');
  eq(abcTable.uid3.toString(), 'Column(uid3|UID3, Table(abc_table))');
});
