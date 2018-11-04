import { throwIfFalsy } from 'throw-if-arg-empty';
import { Action } from './action';
import { Table, ColumnBase } from 'core/core';
import { ActionParam } from './param';

export default class SelectView extends Action {
  fromTable: Table|null = null;
  whereLiterals: string[]|null = null;
  whereColumns: Array<ColumnBase|ActionParam> = [];

  constructor(name: string, columns: ColumnBase[]) {
    super(name);
    throwIfFalsy(columns, 'columns');
  }

  from(table: Table): SelectView {
    throwIfFalsy(table, 'table');
    if (this.fromTable) {
      throw new Error('"from" is called twice');
    }
    this.fromTable = table;
    return this;
  }

  where(literals: TemplateStringsArray, ...columns: Array<ColumnBase|ActionParam>): SelectView {
    if (this.whereLiterals) {
      throw new Error('"where" is called twice');
    }
    this.whereLiterals = literals.map(s => s);
    this.whereColumns = columns;
    return this;
  }
}
