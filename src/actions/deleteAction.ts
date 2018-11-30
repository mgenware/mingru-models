import { Action } from './action';
import { Table } from '../core/core';
import { SQL } from './sql';

export default class DeleteAction extends Action {
  whereSQL: SQL|null = null;

  constructor(name: string, table: Table) {
    super(name, table, 'Delete');
  }

  where(sql: SQL): DeleteAction {
    if (this.whereSQL) {
      throw new Error('"where" is called twice');
    }
    this.whereSQL = sql;
    return this;
  }
}
