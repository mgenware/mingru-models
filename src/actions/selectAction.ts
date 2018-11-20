import { throwIfFalsy } from 'throw-if-arg-empty';
import { Action } from './action';
import { Table, ColumnBase } from '../core/core';
import { SQL } from './sql';

export default class SelectAction extends Action {
  whereSQL: SQL|null = null;

  constructor(name: string, table: Table, public columns: ColumnBase[]) {
    super(name, table);
    throwIfFalsy(columns, 'columns');
  }

  prefix(): string {
    return 'Select';
  }

  where(sql: SQL): SelectAction {
    if (this.whereSQL) {
      throw new Error('"where" is called twice');
    }
    this.whereSQL = sql;
    return this;
  }
}
