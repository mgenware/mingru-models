import { throwIfFalsy } from 'throw-if-arg-empty';
import { View } from './view';
import { Table, ColumnBase } from 'core/core';

export default class SelectView extends View {
  fromTable: Table|null = null;
  whereLiterals: string[]|null = null;
  whereColumns: ColumnBase[] = [];

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

  where(literals: TemplateStringsArray, ...columns: ColumnBase[]): SelectView {
    if (this.whereLiterals) {
      throw new Error('"where" is called twice');
    }
    this.whereLiterals = literals.map(s => s);
    this.whereColumns = columns;
    return this;
  }
}
