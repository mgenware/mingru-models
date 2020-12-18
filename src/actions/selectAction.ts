import { throwIfFalsy } from 'throw-if-arg-empty';
import toTypeString from 'to-type-string';
import { ActionType } from './tableActions';
import { Column, Table } from '../core/core';
import { SQL, SQLVariable } from '../core/sql';
import { CoreSelectAction, CoreSelectionActionData } from './coreSelectAction';
import { RawColumn } from './rawColumn';
import SQLConvertible from '../core/sqlConvertible';
import { sql } from '../core/sqlHelper';

export type SelectedColumn = Column | RawColumn;
export type SelectedColumnAndName = SelectedColumn | string;

export interface UnionTuple {
  action: SelectAction;
  unionAll: boolean;
}

export class OrderByColumn {
  constructor(public readonly column: SelectedColumnAndName, public readonly desc = false) {
    throwIfFalsy(column, 'column');
  }
}

export class OrderByColumnInput {
  constructor(public readonly columns: ReadonlyArray<SelectedColumnAndName>) {
    throwIfFalsy(columns, 'columns');
  }
}

export type OrderByColumnType = OrderByColumn | OrderByColumnInput;

export enum SelectActionMode {
  row,
  field,
  rowList,
  fieldList,
  page,
  exists,
}

export interface SelectActionData extends CoreSelectionActionData {
  mode?: SelectActionMode;
  columns?: SelectedColumn[];
  havingSQLValue?: SQL;
  orderByColumns: OrderByColumnType[];
  groupByColumns: string[];
  limitValue?: SQLVariable | number;
  offsetValue?: SQLVariable | number;
  paginateFlag?: boolean;
  distinctFlag?: boolean;
  unionAllFlag?: boolean;
  unionMembers?: [SelectAction, SelectAction];
  noOrderByFlag?: boolean;
}

/**
 * UNION
 *
 * `a.union(b)` returns a new action(mode=union, unionMembers=[a, b]).
 * This way a and b are untouched, and the union itself can also have
 * properties set such as ORDER BY and LIMIT OFFSET.
 *
 * Nesting:
 * `a.union(b).union(c)` returns:
 * action(mode=union, unionMembers=[
 *   action(mode=union, unionMembers=[a, b]),
 *   c,
 * ])
 *
 * In practice, union members are flattened, we will simply ignore intermediate
 * union member and use the outermost one.
 */
export class SelectAction extends CoreSelectAction {
  private get data(): SelectActionData {
    return this.__data as SelectActionData;
  }

  constructor(columns: SelectedColumn[], mode: SelectActionMode) {
    super(ActionType.select);

    this.data.columns = columns;
    this.data.mode = mode;

    // Validate individual columns.
    columns.forEach((col, idx) => {
      if (!col) {
        throw new Error(`The column at index ${idx} is null, action name "${this.data.name}"`);
      }
      if (col instanceof Column === false && col instanceof RawColumn === false) {
        throw new Error(
          `The column at index ${idx} is not a valid column, got a "${toTypeString(
            col,
          )}", action name "${this.data.name}"`,
        );
      }
    });
  }

  orderByAsc(column: SelectedColumnAndName): this {
    throwIfFalsy(column, 'column');
    this.data.orderByColumns.push(new OrderByColumn(column, false));
    return this;
  }

  orderByDesc(column: SelectedColumnAndName): this {
    throwIfFalsy(column, 'column');
    this.data.orderByColumns.push(new OrderByColumn(column, true));
    return this;
  }

  orderByInput(...columns: SelectedColumnAndName[]): this {
    this.data.orderByColumns.push(new OrderByColumnInput(columns));
    return this;
  }

  groupBy(...columns: SelectedColumnAndName[]): this {
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
      this.data.groupByColumns.push(name);
    }
    return this;
  }

  paginate(): this {
    if (this.mode !== SelectActionMode.rowList && this.mode !== SelectActionMode.fieldList) {
      throw new Error('`paginate` can only be called on `rowList` and `fieldList` modes');
    }
    this.data.paginateFlag = true;
    return this;
  }

  havingSQL(value: SQL): this {
    throwIfFalsy(value, 'value');
    if (!this.data.groupByColumns) {
      throw new Error('You have to call `having` after `groupBy`');
    }
    if (this.data.havingSQLValue) {
      throw new Error('`having` is called twice');
    }
    this.data.havingSQLValue = value;
    return this;
  }

  having(literals: TemplateStringsArray, ...params: SQLConvertible[]): this {
    this.havingSQL(sql(literals, ...params));
    return this;
  }

  distinct(): this {
    this.data.distinctFlag = true;
    return this;
  }

  validate(groupTable: Table) {
    super.validate(groupTable);

    const { mode } = this;
    const selectCollection = mode === SelectActionMode.rowList || mode === SelectActionMode.page;
    if (selectCollection && !this.data.orderByColumns.length && !this.data.noOrderByFlag) {
      throw new Error('An ORDER BY clause is required when selecting multiple rows');
    }
  }

  union(next: SelectAction, pageMode?: boolean): SelectAction {
    return this.unionCore(next, false, pageMode ?? false);
  }

  unionAll(next: SelectAction, pageMode?: boolean): SelectAction {
    return this.unionCore(next, true, pageMode ?? false);
  }

  private unionCore(action: SelectAction, unionAll: boolean, pageMode: boolean): SelectAction {
    throwIfFalsy(action, 'action');
    const newAction = new SelectAction(
      [],
      pageMode ? SelectActionMode.page : SelectActionMode.rowList,
    );
    if (this.data.sqlTable) {
      newAction.from(this.data.sqlTable);
    }
    newAction.data.unionAllFlag = unionAll;
    newAction.data.unionMembers = [this, action];
    return newAction;
  }

  limit(limit: SQLVariable | number): this {
    if (this.data.limitValue !== undefined) {
      throw new Error(`LIMIT has been set to ${this.data.limitValue}`);
    }
    this.data.limitValue = limit;
    return this;
  }

  offset(offset: SQLVariable | number): this {
    if (this.data.limitValue === undefined) {
      throw new Error('OFFSET cannot be set before LIMIT');
    }
    if (this.data.offsetValue !== undefined) {
      throw new Error(`OFFSET has been set to ${this.data.offsetValue}`);
    }
    this.data.offsetValue = offset;
    return this;
  }
}
