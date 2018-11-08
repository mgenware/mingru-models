import { throwIfFalsy } from 'throw-if-arg-empty';
import { Action } from './action';
import { Table, ColumnBase } from '../core/core';
import { SQL } from './sql';
import ColumnSetter from './columnSetter';

export default class UpdateAction extends Action {
  table: Table|null = null;
  whereSQL: SQL|null = null;
  setters: ColumnSetter[] = [];

  constructor(name: string, table: Table) {
    super(name);

    throwIfFalsy(table, 'table');
    this.table = table;
  }

  set(column: ColumnBase, sql: SQL): UpdateAction {
    const setter = new ColumnSetter(column, sql);
    this.setters.push(setter);
    return this;
  }

  where(sql: SQL): UpdateAction {
    if (this.whereSQL) {
      throw new Error('"where" is called twice');
    }
    this.whereSQL = sql;
    return this;
  }
}
