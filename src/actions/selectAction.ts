import { throwIfFalsy } from 'throw-if-arg-empty';
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
  exists,
}

export interface SelectActionData extends CoreSelectionActionData {
  mode?: SelectActionMode;
  columns?: SelectedColumn[];
  havingSQLValue?: SQL;
  orderByColumns?: OrderByColumnType[];
  groupByColumns?: string[];
  limitFlag?: boolean;
  offsetFlag?: boolean;
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
  #data = this.__data as SelectActionData;
  __getData(): SelectActionData {
    return this.#data;
  }

  private mustGetGroupByColumns(): string[] {
    return (this.#data.groupByColumns ??= []);
  }

  private mustGetOrderByColumns(): OrderByColumnType[] {
    return (this.#data.orderByColumns ??= []);
  }

  constructor(columns: SelectedColumn[], mode: SelectActionMode) {
    super(ActionType.select);

    this.#data.columns = columns;
    this.#data.mode = mode;

    // Validate individual columns.
    columns.forEach((col, idx) => {
      if (col instanceof Column === false && col instanceof RawColumn === false) {
        throw new Error(`The column at index ${idx} is not valid, got "${col}", action "${this}"`);
      }
    });
  }

  orderByAsc(column: SelectedColumnAndName): this {
    throwIfFalsy(column, 'column');
    this.mustGetOrderByColumns().push(new OrderByColumn(column, false));
    return this;
  }

  orderByDesc(column: SelectedColumnAndName): this {
    throwIfFalsy(column, 'column');
    this.mustGetOrderByColumns().push(new OrderByColumn(column, true));
    return this;
  }

  orderByInput(...columns: SelectedColumnAndName[]): this {
    this.mustGetOrderByColumns().push(new OrderByColumnInput(columns));
    return this;
  }

  groupBy(...columns: SelectedColumnAndName[]): this {
    throwIfFalsy(columns, 'columns');
    for (const column of columns) {
      let name: string;
      if (column instanceof Column) {
        name = column.__getDBName();
      } else if (column instanceof RawColumn) {
        if (!column.selectedName) {
          throw new Error(`Unexpected empty selected name in ${column.toString()}`);
        }
        name = column.selectedName;
      } else {
        name = column;
      }
      this.mustGetGroupByColumns().push(name);
    }
    return this;
  }

  paginate(): this {
    const { mode } = this.#data;
    if (mode !== SelectActionMode.rowList && mode !== SelectActionMode.fieldList) {
      throw new Error('`paginate` can only be called on `rowList` and `fieldList` modes');
    }
    this.#data.paginateFlag = true;
    return this;
  }

  havingSQL(value: SQL): this {
    throwIfFalsy(value, 'value');
    if (!this.#data.groupByColumns) {
      throw new Error('You have to call `having` after `groupBy`');
    }
    if (this.#data.havingSQLValue) {
      throw new Error('`having` is called twice');
    }
    this.#data.havingSQLValue = value;
    return this;
  }

  having(literals: TemplateStringsArray, ...params: SQLConvertible[]): this {
    this.havingSQL(sql(literals, ...params));
    return this;
  }

  distinct(): this {
    this.#data.distinctFlag = true;
    return this;
  }

  noOrderBy(): this {
    this.#data.noOrderByFlag = true;
    return this;
  }

  __validate(groupTable: Table) {
    super.__validate(groupTable);

    const { mode } = this.#data;
    const listMode = mode === SelectActionMode.rowList || mode === SelectActionMode.fieldList;
    if (listMode && !this.#data.orderByColumns && !this.#data.noOrderByFlag) {
      throw new Error('An ORDER BY clause is required when selecting multiple rows');
    }
  }

  union(next: SelectAction): SelectAction {
    return this.unionCore(next, false);
  }

  unionAll(next: SelectAction): SelectAction {
    return this.unionCore(next, true);
  }

  private unionCore(action: SelectAction, unionAll: boolean): SelectAction {
    throwIfFalsy(action, 'action');
    const newAction = new SelectAction([], SelectActionMode.rowList);
    if (this.#data.sqlTable) {
      newAction.from(this.#data.sqlTable);
    }
    newAction.#data.unionAllFlag = unionAll;
    newAction.#data.unionMembers = [this, action];
    return newAction;
  }

  limit(limitValue?: SQLVariable | number): this {
    this.#data.limitFlag = true;
    if (limitValue !== undefined) {
      if (this.#data.limitValue !== undefined) {
        throw new Error(`LIMIT has been set to ${this.#data.limitValue}`);
      }
      this.#data.limitValue = limitValue;
    }
    return this;
  }

  offset(offsetValue?: SQLVariable | number): this {
    this.#data.offsetFlag = true;
    if (offsetValue !== undefined) {
      if (this.#data.limitValue === undefined) {
        throw new Error('OFFSET cannot be set before LIMIT');
      }
      if (this.#data.offsetValue !== undefined) {
        throw new Error(`OFFSET has been set to ${this.#data.offsetValue}`);
      }
      this.#data.offsetValue = offsetValue;
    }
    return this;
  }
}
