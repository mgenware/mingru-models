import { throwIfFalsy } from 'throw-if-arg-empty';
import { Action } from './action';
import { Table, ColumnBase } from '../core/core';
import { SQL } from './sql';

export default class SelectAction extends Action {
  table: Table|null = null;
  whereSQL: SQL|null = null;

  constructor(name: string, public columns: ColumnBase[]) {
    super(name);
    throwIfFalsy(columns, 'columns');
  }

  from(table: Table): SelectAction {
    throwIfFalsy(table, 'table');
    if (this.table) {
      throw new Error('"from" is called twice');
    }
    this.table = table;
    return this;
  }

  where(sql: SQL): SelectAction {
    if (this.whereSQL) {
      throw new Error('"where" is called twice');
    }
    this.whereSQL = sql;
    return this;
  }
}
