import { throwIfFalsy } from 'throw-if-arg-empty';
import { ActionType } from './ta';
import { Column, ColumnType, Table } from '../core/core';
import { SQL, SQLConvertible, convertToSQL, SQLVariable } from '../core/sql';
import { CoreSelectAction } from './coreSelectAction';
import toTypeString from 'to-type-string';

export type SelectActionColumns = Column | RawColumn;
export type SelectActionColumnNames = SelectActionColumns | string;

export class OrderByColumn {
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
      if (!core.__name) {
        throw new Error(
          'The "core" argument is not initialized (did you accidentally put a RawColumn in a SELECT action?)',
        );
      }
      this.core = core;
      this.selectedName = selectedName || core.__name;
    } else {
      const expr = convertToSQL(core);
      this.core = expr;
      if (selectedName) {
        this.selectedName = selectedName;
      } else {
        // Try to extract a column name from SQL expression
        const col = expr.findFirstColumn();
        if (col) {
          if (!col.__name) {
            throw new Error('core is not initialized');
          }
          this.selectedName = col.__name;
        } else {
          throw new Error(
            'The argument "selectedName" is required for an SQL expression without any columns inside',
          );
        }
      }
    }
  }

  toInput(): SQLVariable {
    const { core, selectedName } = this;
    if (core instanceof SQL) {
      const inferred = core.sniffType();
      if (!inferred) {
        throw new Error('Cannot convert a RawColumn(SQL) to an SQLVariable');
      }
      return new SQLVariable(inferred, selectedName);
    }
    return new SQLVariable(core, selectedName);
  }

  toString(): string {
    return `RawColumn(${this.selectedName}, core = ${this.core.toString()})`;
  }
}

export function sel(
  sql: SQLConvertible,
  selectedName?: string,
  type?: ColumnType,
): RawColumn {
  return new RawColumn(sql, selectedName, type);
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
  hasLimit = false;
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
        name = column.selectedName;
      } else {
        name = column;
      }
      this.groupByColumns.push(name);
    }
    return this;
  }

  limit(): this {
    if (this.mode !== SelectActionMode.list) {
      throw new Error(
        `limit can only be used when mode = 'SelectActionMode.list', current mode is ${this.mode}`,
      );
    }
    this.hasLimit = true;
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
        `An ORDER BY clause is required when select multiple rows, action name "${this.__name}"`,
      );
    }
  }

  private orderByCore(column: SelectActionColumnNames, desc: boolean): this {
    this.orderByColumns.push(new OrderByColumn(column, desc));
    return this;
  }
}
