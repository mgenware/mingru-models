import { Action } from './action';
import { Table, ColumnBase } from '../core/core';

export default class InsertAction extends Action {
  constructor(name: string, table: Table, public columns: ColumnBase[]) {
    super(name, table, 'Insert');
  }
}
