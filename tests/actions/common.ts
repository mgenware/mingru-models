import * as dd from '../../';

export function listColumnsFromSQL(sql: dd.SQL) {
  const arr: dd.Column[] = [];
  sql.enumerateColumns(col => {
    arr.push(col);
    return false;
  });
  return arr;
}
