import { throwIfFalsy } from 'throw-if-arg-empty';
import { ActionType } from './action';
import { Table, ColumnBase, SQL } from '../core/core';
import CoreSelectAction from './coreSelectAction';
import OrderBy from './orderBy';

export default class SelectAction extends CoreSelectAction {
  whereSQL: SQL | null = null;
  isSelectField = false;
  orderByColumns: OrderBy[] = [];

  constructor(
    name: string,
    table: Table,
    public columns: ColumnBase[],
    public isSelectAll: boolean,
  ) {
    super(name, ActionType.select, table, 'Select');
    throwIfFalsy(columns, 'columns');
  }

  orderBy(column: ColumnBase): this {
    return this.orderByCore(column, false);
  }

  orderByDesc(column: ColumnBase): this {
    return this.orderByCore(column, true);
  }

  private orderByCore(column: ColumnBase, desc: boolean): this {
    this.orderByColumns.push(new OrderBy(column, desc));
    return this;
  }
}
