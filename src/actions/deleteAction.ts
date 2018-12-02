import { Action, ActionType } from './action';
import { Table, SQL } from '../core/core';

export default class DeleteAction extends Action {
  whereSQL: SQL | null = null;

  constructor(name: string, table: Table) {
    super(name, ActionType.delete, table, 'Delete');
  }

  where(sql: SQL): DeleteAction {
    if (this.whereSQL) {
      throw new Error('"where" is called twice');
    }
    this.whereSQL = sql;
    return this;
  }
}
