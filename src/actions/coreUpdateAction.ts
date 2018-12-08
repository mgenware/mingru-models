import { Action } from './action';
import { ColumnBase, SQL } from '../core/core';
import { throwIfFalsy } from 'throw-if-arg-empty';

export default class CoreUpdateAction extends Action {
  columnValueMap = new Map<ColumnBase, SQL>();

  set(column: ColumnBase, value: SQL): this {
    throwIfFalsy(column, 'column');
    throwIfFalsy(value, 'value');
    this.columnValueMap.set(column, value);
    return this;
  }

  setInputs(...columns: ColumnBase[]): this {
    throwIfFalsy(columns, 'columns');
    for (const col of columns) {
      this.columnValueMap.set(col, col.toInputSQL());
    }
    return this;
  }
}
