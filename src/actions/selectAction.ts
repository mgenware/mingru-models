import { throwIfFalsy } from 'throw-if-arg-empty';
import { ActionType } from './ta';
import { Column, ColumnType } from '../core/core';
import { SQL, SQLConvertible, convertToSQL } from '../core/sql';
import CoreSelectAction from './coreSelectAction';
import toTypeString from 'to-type-string';

export type SelectActionColumns = Column | RawColumn;
export type SelectActionColumnNames = SelectActionColumns | string;

export class ColumnName {
  constructor(public column: SelectActionColumnNames, public desc = false) {
    throwIfFalsy(column, 'column');
  }
}

export class RawColumn {
  // This is guaranteed not to be empty/null in ctor
  selectedName = '';
  core: Column | SQL;

  constructor(
    core: SQLConvertible,
    selectedName?: string,
    public type?: ColumnType,
  ) {
    throwIfFalsy(core, 'core');
    if (core instanceof Column) {
      const col = core as Column;
      this.core = col;
      this.selectedName = selectedName || col.__name;
    } else {
      const expr = convertToSQL(core);
      this.core = expr;
      if (selectedName) {
        this.selectedName = selectedName;
      } else {
        // Try to extract a column name from SQL expression
        const col = expr.findColumn();
        if (col) {
          this.selectedName = col.__name;
        } else {
          throw new Error(
            'The argument "selectedName" is required for an SQL expression without any columns inside',
          );
        }
      }
    }
  }
}

export function sel(
  sql: SQLConvertible,
  selectedName?: string,
  type?: ColumnType,
): RawColumn {
  return new RawColumn(convertToSQL(sql), selectedName, type);
}

export class SelectAction extends CoreSelectAction {
  havingSQL: SQL | null = null;
  havingValidator: ((value: SQL) => void) | null = null;
  isSelectField = false;
  pagination = false;
  orderByColumns: ColumnName[] = [];
  groupByColumns: ColumnName[] = [];

  constructor(
    public columns: SelectActionColumns[],
    public isSelectAll: boolean,
  ) {
    super(ActionType.select);
    throwIfFalsy(columns, 'columns');
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

  orderBy(column: SelectActionColumnNames): this {
    throwIfFalsy(column, 'column');
    return this.orderByCore(column, false);
  }

  orderByDesc(column: SelectActionColumnNames): this {
    throwIfFalsy(column, 'column');
    return this.orderByCore(column, true);
  }

  groupBy(column: SelectActionColumnNames): this {
    throwIfFalsy(column, 'column');
    this.groupByColumns.push(new ColumnName(column));
    return this;
  }

  paginate(): this {
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

  private orderByCore(column: SelectActionColumnNames, desc: boolean): this {
    this.orderByColumns.push(new ColumnName(column, desc));
    return this;
  }
}
