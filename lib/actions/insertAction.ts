import { throwIfFalsy } from 'throw-if-arg-empty';
import { Action } from './action';
import { Table, ColumnBase } from '../core/core';
import { SQL } from './sql';
import ColumnSetter from './columnSetter';

export default class InsertAction extends Action {
  table: Table|null = null;
  setters: ColumnSetter[] = [];

  constructor(name: string, table: Table) {
    super(name);

    throwIfFalsy(table, 'table');
    this.table = table;
  }

  prefix(): string {
    return 'Insert';
  }

  set(column: ColumnBase, sql: SQL): InsertAction {
    const setter = new ColumnSetter(column, sql);
    this.setters.push(setter);
    return this;
  }
}
