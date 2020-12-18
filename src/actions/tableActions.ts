/* eslint-disable no-param-reassign */
import { throwIfFalsy } from 'throw-if-arg-empty';
import toTypeString from 'to-type-string';
import { ActionAttribute } from '../attrs';
import { Table } from '../core/core';
import * as defs from '../core/defs';
import { SQLVariable } from '../core/sql';

export interface TableActionOptions {
  unsafeTableInput?: boolean;
}

export class TableActions {
  #table!: Table;
  get __table(): Table {
    return this.#table;
  }

  #actions!: Readonly<Record<string, Action>>;
  get __actions(): Readonly<Record<string, Action>> {
    return this.#actions;
  }

  #options: TableActionOptions = {};
  get __options(): TableActionOptions | undefined {
    return this.#options;
  }

  __configure(
    table: Table,
    actions: Readonly<Record<string, Action>>,
    options: TableActionOptions | undefined,
  ) {
    this.#table = table;
    this.#actions = actions;
    this.#options = options ?? {};
  }
}

export enum ActionType {
  select,
  insert,
  update,
  delete,
  transact,
  wrap,
}

export interface ActionData {
  actionType?: ActionType;
  // Will be set after calling `mm.tableActions`.
  name?: string;
  // Set by `from()`.
  sqlTable?: Table;
  // Will be set after calling `mm.tableActions`.
  groupTable?: Table;
  argStubs?: SQLVariable[];
  attrs?: Map<ActionAttribute, unknown>;
}

export class Action {
  protected __data: ActionData = {};

  getActionData(): ActionData {
    return this.__data;
  }

  constructor(actionType: ActionType) {
    this.__data.actionType = actionType;
  }

  from(table: Table): this {
    this.__data.sqlTable = table;
    return this;
  }

  argStubs(...args: SQLVariable[]): this {
    this.__data.argStubs = args;
    return this;
  }

  // `groupTable` the one from `validate`.
  // Returns the table this action applies to.
  // `__sqlTable` has the highest precedence, and can be set by `from`.
  // If `from` is not called, which is the usual case, it tries to grab one
  // from `__groupTable`, which is the containing table when an action is
  // initialized from `mm.tableActions`.
  // Finally, for inline actions (if `from` is not called), it can use the
  // `groupTable` from `validate` method.
  mustGetAvailableSQLTable(groupTable: Table | undefined | null): Table {
    const table = this.__data.sqlTable || this.__data.groupTable || groupTable;
    if (!table) {
      throw new Error(`Action "${toTypeString(this)}" doesn't have any tables`);
    }
    return table;
  }

  mustGetGroupTable(): Table {
    const table = this.__data.groupTable;
    if (!table) {
      throw new Error(`Action "${toTypeString(this)}" doesn't have a group able`);
    }
    return table;
  }

  mustGetName(): string {
    if (!this.__data.name) {
      throw new Error(`Action "${toTypeString(this)}" doesn't have a name`);
    }
    return this.__data.name;
  }

  attr(name: ActionAttribute, value: unknown): this {
    (this.__data.attrs ??= new Map<ActionAttribute, unknown>()).set(name, value);
    return this;
  }

  privateAttr(): this {
    return this.attr(ActionAttribute.isPrivate, true);
  }

  resultTypeNameAttr(resultTypeName: string): this {
    return this.attr(ActionAttribute.resultTypeName, resultTypeName);
  }

  toString(): string {
    let str = `${toTypeString(this)}(${this.__data.name}, ${this.__data.groupTable})`;
    if (this.__data.sqlTable && this.__data.sqlTable !== this.__data.groupTable) {
      str += `(${this.__data.sqlTable})`;
    }
    return str;
  }

  // Automatically called by `mm.tableActions` for all the columns it walks through.
  // Actions are immutable. Actions touched by `mm.tableActions` will have `__groupTable`
  // and `__name` set.
  // Other actions, such as ones embedded in SQL exprs are ignored by `ta.tableActions`,
  // thus have to be manually taken care of. You should always use
  // `this.mustGetAvailableSQLTable(groupTable)` in `validate`, and use the result value for
  // action SQL validation.
  // If we need to call `validate` on child components (e.g. a TRANSACT action), pass down the
  // `groupTable` param of `validate`.
  // eslint-disable-next-line class-methods-use-this
  validate(_groupTable: Table) {
    // Implemented by subclass.
  }

  // Called by `ta.tableActions`.
  __configure(groupTable: Table, name: string) {
    if (!this.__data.name) {
      this.__data.name = name;
    }
    if (!this.__data.groupTable) {
      this.__data.groupTable = groupTable;
    }
    this.validate(this.__data.groupTable || groupTable);
  }
}

export class EmptyAction extends Action {
  // eslint-disable-next-line class-methods-use-this
  initActionData(): ActionData {
    return {};
  }
}

// An empty action is ignored in `enumerateActions`.
export const emptyAction = new EmptyAction(ActionType.select);

function enumerateActions<T extends TableActions>(
  ta: T,
  cb: (action: Action, prop: string) => void,
) {
  throwIfFalsy(ta, 'ta');

  for (const pair of Object.entries(ta)) {
    const name = pair[0];
    const value = pair[1] as unknown;
    // Ignore internal props and functions.
    if (name.startsWith(defs.InternalPropPrefix)) {
      continue;
    }
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    if (value instanceof Action && value !== emptyAction) {
      cb(value, name);
    }
  }
}

export function tableActionsCore(
  table: Table,
  tableActionsObj: TableActions | null,
  actions: Record<string, Action>,
  options: TableActionOptions | undefined,
): TableActions {
  throwIfFalsy(table, 'table');

  tableActionsObj = tableActionsObj || new TableActions();
  for (const [name, action] of Object.entries(actions)) {
    try {
      action.__configure(table, name);
    } catch (err) {
      err.message += ` [action "${name}"]`;
      throw err;
    }
  }
  tableActionsObj.__configure(table, actions, options);
  return tableActionsObj;
}

export function tableActions<T extends Table, A extends TableActions>(
  table: T,
  TACls: new () => A,
  options?: TableActionOptions,
): A {
  throwIfFalsy(table, 'table');

  try {
    const taObj = new TACls();
    const actions: Record<string, Action> = {};
    enumerateActions(taObj, (action, name) => {
      actions[name] = action;
    });
    return tableActionsCore(table, taObj, actions, options) as A;
  } catch (err) {
    err.message += ` [table "${table}"]`;
    throw err;
  }
}
