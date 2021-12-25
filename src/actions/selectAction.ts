import { throwIfFalsy } from 'throw-if-arg-empty';
import { ActionType } from './tableActions.js';
import { Column, Table, SelectedColumn, SQL, SQLVariable } from '../core/core.js';
import { CoreSelectAction, CoreSelectionActionData } from './coreSelectAction.js';
import SQLConvertible from '../core/sqlConvertible.js';
import { sql } from '../core/sqlHelper.js';

export type SelectedColumnTypes = Column | SelectedColumn;
export type SelectedColumnTypesOrName = SelectedColumnTypes | string;

export interface UnionTuple {
  action: SelectAction;
  unionAll: boolean;
}

export class OrderByColumn {
  constructor(public readonly column: SelectedColumnTypesOrName, public readonly desc = false) {
    throwIfFalsy(column, 'column');
  }
}

export class OrderByColumnInput {
  constructor(public readonly columns: ReadonlyArray<SelectedColumnTypesOrName>) {
    throwIfFalsy(columns, 'columns');
  }
}

export type OrderByColumnType = OrderByColumn | OrderByColumnInput;

export enum SelectActionMode {
  row = 1,
  field,
  rowList,
  fieldList,
  exists,
}

export enum SelectActionPaginationMode {
  // When the user calls `limit` and `offset`.
  limitOffset = 1,
  // When the user calls `paginate`.
  pagination,
  // When the user calls `pageMode`.
  pageMode,
}

export interface SelectActionData extends CoreSelectionActionData {
  mode?: SelectActionMode;
  columns?: SelectedColumnTypes[];
  havingSQLValue?: SQL;
  orderByColumns?: OrderByColumnType[];
  groupByColumns?: string[];
  paginationMode?: SelectActionPaginationMode;
  limitValue?: SQLVariable | number;
  offsetValue?: SQLVariable | number;
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

  constructor(columns: SelectedColumnTypes[], mode: SelectActionMode) {
    super(ActionType.select);

    this.#data.columns = columns;
    this.#data.mode = mode;

    // Validate individual columns.
    columns.forEach((col, idx) => {
      if (col instanceof Column === false && col instanceof SelectedColumn === false) {
        throw new Error(`The column at index ${idx} is not valid, got "${col}", action "${this}"`);
      }
    });
  }

  orderByAsc(column: SelectedColumnTypesOrName): this {
    throwIfFalsy(column, 'column');
    this.mustGetOrderByColumns().push(new OrderByColumn(column, false));
    return this;
  }

  orderByDesc(column: SelectedColumnTypesOrName): this {
    throwIfFalsy(column, 'column');
    this.mustGetOrderByColumns().push(new OrderByColumn(column, true));
    return this;
  }

  orderByInput(...columns: SelectedColumnTypesOrName[]): this {
    this.mustGetOrderByColumns().push(new OrderByColumnInput(columns));
    return this;
  }

  groupBy(...columns: SelectedColumnTypesOrName[]): this {
    throwIfFalsy(columns, 'columns');
    for (const column of columns) {
      let name: string;
      if (column instanceof Column) {
        name = column.__getDBName();
      } else if (column instanceof SelectedColumn) {
        const { selectedName } = column.__getData();
        if (!selectedName) {
          throw new Error(`Unexpected empty selected name in ${column.toString()}`);
        }
        name = selectedName;
      } else {
        name = column;
      }
      this.mustGetGroupByColumns().push(name);
    }
    return this;
  }

  paginate(): this {
    this.setPaginationMode(SelectActionPaginationMode.pagination);
    return this;
  }

  pageMode(): this {
    this.setPaginationMode(SelectActionPaginationMode.pageMode);
    return this;
  }

  private setPaginationMode(pgMode: SelectActionPaginationMode) {
    const { paginationMode, mode } = this.#data;
    if (mode !== SelectActionMode.rowList && mode !== SelectActionMode.fieldList) {
      throw new Error('`paginationMode` can only be set for `.rowList` and `.fieldList` modes');
    }
    if (paginationMode) {
      throw new Error(`\`paginationMode\` has been set to "${this.#data.paginationMode}"`);
    }
    this.#data.paginationMode = pgMode;
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

  override __validate(groupTable: Table) {
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
    this.setPaginationMode(SelectActionPaginationMode.limitOffset);
    this.#data.limitValue = limitValue;
    return this;
  }

  offset(offsetValue: SQLVariable | number | undefined): this {
    if (this.#data.paginationMode !== SelectActionPaginationMode.limitOffset) {
      throw new Error('`offset` can only called after `limit`');
    }
    if (offsetValue !== undefined) {
      if (this.#data.offsetValue !== undefined) {
        throw new Error(`OFFSET has been set to ${this.#data.offsetValue}`);
      }
      this.#data.offsetValue = offsetValue;
    }
    return this;
  }
}
