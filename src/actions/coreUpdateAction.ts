import { Action } from './action';
import { Column } from '../core/core';
import { SQL } from '../core/sql';
import { throwIfFalsy } from 'throw-if-arg-empty';

export default class CoreUpdateAction extends Action {
  columnValueMap = new Map<Column, SQL>();

  set(column: Column, value: SQL): this {
    throwIfFalsy(column, 'column');
    throwIfFalsy(value, 'value');
    this.columnValueMap.set(column, value);
    return this;
  }

  setInputs(...columns: Column[]): this {
    throwIfFalsy(columns, 'columns');
    for (const col of columns) {
      this.columnValueMap.set(col, col.toInputSQL());
    }
    return this;
  }
}
