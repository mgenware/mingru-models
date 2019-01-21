import * as dd from '../../';
import user from '../models/user';

class ABCTable extends dd.Table {
  StatusString = dd.varChar(10);
  statusType = dd.varChar(10);
  statusID = dd.int().setName('customName');
  uid1 = user.id;
  uid2 = user.id;
  uid3 = user.id.setName('ID3');
}

class DEFTable extends dd.Table {}

const abcTable = dd.table(ABCTable);
const defTable = dd.table(DEFTable, 't');

test('Capitalized to snake_case', () => {
  expect(abcTable.__name).toBe('abc_table');
  expect(defTable.__name).toBe('t');
  expect(abcTable.StatusString.props.name).toBe('status_string');
  expect(abcTable.statusType.props.name).toBe('status_type');
  expect(abcTable.statusID.props.name).toBe('customName');
});

test('Rename a FK', () => {
  expect(abcTable.uid1.props.name).toBe('uid1');
  expect(abcTable.uid2.props.name).toBe('uid2');
  expect(abcTable.uid3.props.name).toBe('ID3');
});
