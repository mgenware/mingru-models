import { throwIfFalsy } from 'throw-if-arg-empty';
import { ActionType } from './action';
import { Table, ColumnBase, SQL } from '../core/core';
import CoreSelectAction from './coreSelectAction';

export default class SelectAction extends CoreSelectAction {
  whereSQL: SQL | null = null;
  isSelectField = false;

  constructor(
    name: string,
    table: Table,
    public columns: ColumnBase[],
    public isSelectAll: boolean,
  ) {
    super(name, ActionType.select, table, 'Select');
    throwIfFalsy(columns, 'columns');
  }
}
