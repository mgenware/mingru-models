import { ColumnBase, SQL } from '../core/core';
import { throwIfFalsy } from 'throw-if-arg-empty';

export default class ColumnSetter {
  constructor(public column: ColumnBase, public sql: SQL) {
    throwIfFalsy(column, 'column');
    throwIfFalsy(sql, 'sql');
  }
}
