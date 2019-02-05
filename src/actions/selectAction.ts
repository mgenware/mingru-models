import { throwIfFalsy } from 'throw-if-arg-empty';
import { ActionType } from './action';
import { Table, Column, ColumnType } from '../core/core';
import { SQL, SQLConvertible, convertToSQL } from '../core/sql';
import CoreSelectAction from './coreSelectAction';
import toTypeString from 'to-type-string';

export type SelectActionColumns = Column | CalculatedColumn;
export type SelectActionColumnNames = SelectActionColumns | string;

export class ColumnName {
  constructor(public columnName: string, public desc = false) {
    throwIfFalsy(columnName, 'columnName');
  }
}

export class CalculatedColumn {
  core: Column | SQL;

  constructor(
    core: SQLConvertible,
    public selectedName: string,
    public type?: ColumnType,
  ) {
    throwIfFalsy(core, 'core');
    throwIfFalsy(selectedName, 'selectedName');
    if (core instanceof Column) {
      this.core = core;
    } else {
      this.core = convertToSQL(core);
    }
  }
}

export function select(
  sql: SQLConvertible,
  selectedName: string,
  type?: ColumnType,
): CalculatedColumn {
  return new CalculatedColumn(convertToSQL(sql), selectedName, type);
}

function getColumnName(col: SelectActionColumnNames): string {
  if (typeof col === 'string') {
    return col as string;
  }
  if (col instanceof Column) {
    return (col as Column).name;
  }
  if (col instanceof CalculatedColumn) {
    return (col as CalculatedColumn).selectedName;
  }
  throw new Error(
    `Unsupported column type "${toTypeString(col)}", value "${col}"`,
  );
}

export class SelectAction<T extends Table> extends CoreSelectAction {
  whereSQL: SQL | null = null;
  isSelectField = false;
  orderByColumns: ColumnName[] = [];
  groupByColumns: ColumnName[] = [];

  constructor(
    name: string,
    table: T,
    public columns: SelectActionColumns[],
    public isSelectAll: boolean,
  ) {
    super(name, ActionType.select, table, 'Select');
    throwIfFalsy(columns, 'columns');
  }

  orderBy(column: SelectActionColumnNames): this {
    throwIfFalsy(column, 'column');
    return this.orderByCore(getColumnName(column), false);
  }

  orderByDesc(column: SelectActionColumnNames): this {
    throwIfFalsy(column, 'column');
    return this.orderByCore(getColumnName(column), true);
  }

  groupBy(column: SelectActionColumnNames): this {
    throwIfFalsy(column, 'column');
    this.groupByColumns.push(new ColumnName(getColumnName(column)));
    return this;
  }

  private orderByCore(columnName: string, desc: boolean): this {
    this.orderByColumns.push(new ColumnName(columnName, desc));
    return this;
  }
}
