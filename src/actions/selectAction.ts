import { throwIfFalsy } from 'throw-if-arg-empty';
import { ActionType } from './action';
import { Table, Column, SelectedColumn, SQL } from '../core/core';
import CoreSelectAction from './coreSelectAction';
import toTypeString from 'to-type-string';

export type SelectActionColumns = Column | SelectedColumn;
export type OrderByColumns = SelectActionColumns | string;

export class ColumnName {
  constructor(public columnName: string, public desc = false) {
    throwIfFalsy(columnName, 'columnName');
  }
}

function getColumnName(col: OrderByColumns): string {
  if (col instanceof Column) {
    return (col as Column).props.name;
  }
  if (col instanceof SelectedColumn) {
    return (col as SelectedColumn).selectedName;
  }
  if (typeof col === 'string') {
    return col as string;
  }
  throw new Error(
    `Unsupported column type "${toTypeString(col)}", value "${col}"`,
  );
}

export class SelectAction extends CoreSelectAction {
  whereSQL: SQL | null = null;
  isSelectField = false;
  orderByColumns: ColumnName[] = [];

  constructor(
    name: string,
    table: Table,
    public columns: SelectActionColumns[],
    public isSelectAll: boolean,
  ) {
    super(name, ActionType.select, table, 'Select');
    throwIfFalsy(columns, 'columns');
  }

  orderBy(column: OrderByColumns): this {
    throwIfFalsy(column, 'column');
    return this.orderByCore(getColumnName(column), false);
  }

  orderByDesc(column: OrderByColumns): this {
    throwIfFalsy(column, 'column');
    return this.orderByCore(getColumnName(column), true);
  }

  private orderByCore(columnName: string, desc: boolean): this {
    this.orderByColumns.push(new ColumnName(columnName, desc));
    return this;
  }
}
