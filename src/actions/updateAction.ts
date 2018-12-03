import { Action, ActionType } from './action';
import { Table, ColumnBase, SQL, sql } from '../core/core';
import ColumnSetter from './columnSetter';
import { throwIfFalsy } from 'throw-if-arg-empty';

export default class UpdateAction extends Action {
  whereSQL: SQL | null = null;
  setters: ColumnSetter[] = [];

  constructor(name: string, table: Table) {
    super(name, ActionType.update, table, 'Update');
  }

  set(column: ColumnBase, sql: SQL): UpdateAction {
    const setter = new ColumnSetter(column, sql);
    this.setters.push(setter);
    return this;
  }

  setToInput(column: ColumnBase, name?: string): UpdateAction {
    throwIfFalsy(column, 'column');
    const inputSQL = sql`${column.toInput(name)}`;
    return this.set(column, inputSQL);
  }

  where(sql: SQL): UpdateAction {
    if (this.whereSQL) {
      throw new Error('"where" is called twice');
    }
    this.whereSQL = sql;
    return this;
  }
}
