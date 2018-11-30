import { throwIfFalsy } from 'throw-if-arg-empty';
import { Action, ActionType } from './action';
import { Table, ColumnBase } from '../core/core';
import { SQL } from './sql';

export default class SelectAction extends Action {
  whereSQL: SQL|null = null;

  constructor(
    name: string,
    table: Table,
    public columns: ColumnBase[],
    public selectAll: boolean,
  ) {
    super(name, ActionType.select, table, 'Select');
    throwIfFalsy(columns, 'columns');
  }

  where(sql: SQL): SelectAction {
    if (this.whereSQL) {
      throw new Error('"where" is called twice');
    }
    this.whereSQL = sql;
    return this;
  }
}
