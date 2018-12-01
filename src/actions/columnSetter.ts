import { ColumnBase } from '../core/core';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { SQL } from './sql';

export default class ColumnSetter {
  constructor(public column: ColumnBase, public sql: SQL) {
    throwIfFalsy(column, 'column');
    throwIfFalsy(sql, 'sql');
  }
}
