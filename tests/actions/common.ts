import * as mm from '../..';

export function listColumnsFromSQL(sql: mm.SQL) {
  const arr: mm.Column[] = [];
  sql.enumerateColumns((col) => {
    arr.push(col);
    return false;
  });
  return arr;
}
