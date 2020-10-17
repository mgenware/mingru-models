import { throwIfFalsy } from 'throw-if-arg-empty';
import toTypeString from 'to-type-string';
import { ActionType } from './tableActions';
import { Column, Table } from '../core/core';
import { SQL, SQLVariable } from '../core/sql';
import { CoreSelectAction } from './coreSelectAction';
import { RawColumn } from './rawColumn';
import SQLConvertible from '../core/sqlConvertible';
import { sql } from '../core/sqlHelper';

export type SelectActionColumns = Column | RawColumn;
export type SelectActionColumnNames = SelectActionColumns | string;

export class OrderByColumn {
  constructor(public column: SelectActionColumnNames, public desc = false) {
    throwIfFalsy(column, 'column');
  }
}

export class OrderByColumnInput {
  constructor(public columns: SelectActionColumnNames[]) {
    throwIfFalsy(columns, 'columns');
  }
}

export type OrderByColumnType = OrderByColumn | OrderByColumnInput;

export enum SelectActionMode {
  row,
  field,
  list,
  page,
  exists,
}

export class SelectAction extends CoreSelectAction {
  havingSQLValue: SQL | null = null;
  havingValidator: ((value: SQL) => void) | null = null;
  orderByColumns: OrderByColumnType[] = [];
  groupByColumns: string[] = [];
  limitValue: SQLVariable | number | undefined;
  offsetValue: SQLVariable | number | undefined;
  pagination = false;
  distinctFlag = false;
  // Set by `unionAll`.
  unionAllFlag = false;
  // Set by `union` or `unionAll`.
  nextSelectAction: SelectAction | null = null;

  constructor(public columns: SelectActionColumns[], public mode: SelectActionMode) {
    super(ActionType.select);

    // Validate individual columns.
    columns.forEach((col, idx) => {
      if (!col) {
        throw new Error(`The column at index ${idx} is null, action name "${this.__name}"`);
      }
      if (col instanceof Column === false && col instanceof RawColumn === false) {
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
    this.orderByColumns.push(new OrderByColumn(column, false));
    return this;
  }

  orderByDesc(column: SelectActionColumnNames): this {
    throwIfFalsy(column, 'column');
    this.orderByColumns.push(new OrderByColumn(column, true));
    return this;
  }

  orderByInput(...columns: SelectActionColumnNames[]): this {
    this.orderByColumns.push(new OrderByColumnInput(columns));
    return this;
  }

  groupBy(...columns: SelectActionColumnNames[]): this {
    throwIfFalsy(columns, 'columns');
    for (const column of columns) {
      let name: string;
      if (column instanceof Column) {
        name = column.getDBName();
      } else if (column instanceof RawColumn) {
        if (!column.selectedName) {
          throw new Error(`Unexpected empty selected name in ${column.toString()}`);
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

  limit(limit: SQLVariable | number): this {
    this.setLimitValue(limit);
    return this;
  }

  offset(offset: SQLVariable | number): this {
    this.setOffsetValue(offset);
    return this;
  }

  havingSQL(value: SQL): this {
    throwIfFalsy(value, 'value');
    if (!this.groupByColumns) {
      throw new Error('You have to call `having` after `groupBy`');
    }
    if (this.havingValidator) {
      this.havingValidator(value);
    }

    if (this.havingSQLValue) {
      throw new Error('`having` is called twice');
    }
    this.havingSQLValue = value;
    return this;
  }

  having(literals: TemplateStringsArray, ...params: SQLConvertible[]): this {
    this.havingSQL(sql(literals, ...params));
    return this;
  }

  distinct(): this {
    this.distinctFlag = true;
    return this;
  }

  validate(table: Table) {
    super.validate(table);

    const { mode } = this;
    const selectCollection = mode === SelectActionMode.list || mode === SelectActionMode.page;
    if (selectCollection && !this.orderByColumns.length) {
      throw new Error('An ORDER BY clause is required when selecting multiple rows');
    }
  }

  union(next: SelectAction): this {
    return this.unionCore(next, false);
  }

  unionAll(next: SelectAction): this {
    return this.unionCore(next, true);
  }

  private unionCore(next: SelectAction, all: boolean): this {
    throwIfFalsy(next, 'next');
    this.nextSelectAction = next;
    this.unionAllFlag = all;
    return this;
  }

  private setLimitValue(limit: SQLVariable | number) {
    if (this.limitValue !== undefined) {
      throw new Error(`LIMIT has been set to ${this.limitValue}`);
    }
    this.limitValue = limit;
  }

  private setOffsetValue(offset: SQLVariable | number) {
    if (this.limitValue === undefined) {
      throw new Error('OFFSET cannot be set before LIMIT');
    }
    if (this.offsetValue !== undefined) {
      throw new Error(`OFFSET has been set to ${this.offsetValue}`);
    }
    this.offsetValue = offset;
  }
}
