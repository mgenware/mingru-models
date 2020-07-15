import { throwIfFalsy } from 'throw-if-arg-empty';
import toTypeString from 'to-type-string';
import { ActionType } from './tableActions';
import { Column, Table } from '../core/core';
import { SQL } from '../core/sql';
import { CoreSelectAction } from './coreSelectAction';
import { RawColumn } from './rawColumn';

export type SelectActionColumns = Column | RawColumn;
export type SelectActionColumnNames = SelectActionColumns | string;

export class OrderByColumn {
  constructor(public column: SelectActionColumnNames, public desc = false) {
    throwIfFalsy(column, 'column');
  }
}

export enum SelectActionMode {
  row,
  field,
  list,
  page,
}

export class SelectAction extends CoreSelectAction {
  havingSQL: SQL | null = null;
  havingValidator: ((value: SQL) => void) | null = null;
  // Only used in rows mode.
  pagination = false;
  orderByColumns: OrderByColumn[] = [];
  groupByColumns: string[] = [];

  constructor(
    public columns: SelectActionColumns[],
    public mode: SelectActionMode,
  ) {
    super(ActionType.select);
    // Validate individual column
    columns.forEach((col, idx) => {
      if (!col) {
        throw new Error(
          `The column at index ${idx} is null, action name "${this.__name}"`,
        );
      }
      if (
        col instanceof Column === false &&
        col instanceof RawColumn === false
      ) {
        throw new Error(
          `The column at index ${idx} is not a valid column, got a "${toTypeString(
            col,
          )}", action name "${this.__name}"`,
        );
      }
    });
  }

  orderByAsc(column: SelectActionColumnNames): this {
    throwIfFalsy(column, 'column');
    return this.orderByCore(column, false);
  }

  orderByDesc(column: SelectActionColumnNames): this {
    throwIfFalsy(column, 'column');
    return this.orderByCore(column, true);
  }

  groupBy(...columns: SelectActionColumnNames[]): this {
    throwIfFalsy(columns, 'columns');
    for (const column of columns) {
      let name: string;
      if (column instanceof Column) {
        name = column.getDBName();
      } else if (column instanceof RawColumn) {
        if (!column.selectedName) {
          throw new Error(
            `Unexpected empty selected name in ${column.toString()}`,
          );
        }
        name = column.selectedName;
      } else {
        name = column;
      }
      this.groupByColumns.push(name);
    }
    return this;
  }

  paginate(): this {
    if (this.mode !== SelectActionMode.list) {
      throw new Error(
        `'paginate' can only be used when mode = 'SelectActionMode.list', current mode is ${this.mode}`,
      );
    }
    this.pagination = true;
    return this;
  }

  having(value: SQL): this {
    throwIfFalsy(value, 'value');
    if (!this.groupByColumns) {
      throw new Error('You have to call `having` after `groupBy`');
    }
    if (this.havingValidator) {
      this.havingValidator(value);
    }

    if (this.havingSQL) {
      throw new Error('`having` is called twice');
    }
    this.havingSQL = value;
    return this;
  }

  validate(table: Table, name: string) {
    super.validate(table, name);

    const { mode } = this;
    const selectCollection =
      mode === SelectActionMode.list || mode === SelectActionMode.page;
    if (selectCollection && !this.orderByColumns.length) {
      throw new Error(
        'An ORDER BY clause is required when selecting multiple rows',
      );
    }
  }

  private orderByCore(column: SelectActionColumnNames, desc: boolean): this {
    this.orderByColumns.push(new OrderByColumn(column, desc));
    return this;
  }
}
