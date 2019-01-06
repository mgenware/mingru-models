import * as dd from '../../';

class ABCTable extends dd.Table {
  StatusString = dd.varChar(10);
  statusType = dd.varChar(10);
  statusID = dd.int().setName('customName');
}

class DEFTable extends dd.Table {}

const abcTable = dd.table(ABCTable);
const defTable = dd.table(DEFTable, 't');

test('Capitalized to snake_case', () => {
  expect(abcTable.__name).toBe('abc_table');
  expect(defTable.__name).toBe('t');
  expect(abcTable.StatusString.__name).toBe('status_string');
  expect(abcTable.statusType.__name).toBe('status_type');
  expect(abcTable.statusID.__name).toBe('customName');
});
