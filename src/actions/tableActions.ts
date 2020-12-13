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

export class Action {
  // Will be set after calling `mm.tableActions`.
  #name: string | null = null;
  get __name(): string | null {
    return this.#name;
  }

  // Set by `from()`.
  #sqlTable: Table | null = null;
  get __sqlTable(): Table | null {
    return this.#sqlTable;
  }

  // Will be set after calling `mm.tableActions`.
  #groupTable: Table | null = null;
  get __groupTable(): Table | null {
    return this.#groupTable;
  }

  #argStubs: SQLVariable[] = [];
  get __argStubs(): ReadonlyArray<SQLVariable> {
    return this.#argStubs;
  }

  #attrs = new Map<ActionAttribute, unknown>();
  get __attrs(): ReadonlyMap<ActionAttribute, unknown> {
    return this.#attrs;
  }

  constructor(public actionType: ActionType) {}

  from(table: Table): this {
    this.#sqlTable = table;
    return this;
  }

  argStubs(...args: SQLVariable[]): this {
    this.#argStubs = args;
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
    const table = this.__sqlTable || this.__groupTable || groupTable;
    if (!table) {
      throw new Error(`Action "${toTypeString(this)}" doesn't have any tables`);
    }
    return table;
  }

  mustGetGroupTable(): Table {
    const table = this.__groupTable;
    if (!table) {
      throw new Error(`Action "${toTypeString(this)}" doesn't have a group able`);
    }
    return table;
  }

  mustGetName(): string {
    if (!this.__name) {
      throw new Error(`Action "${toTypeString(this)}" doesn't have a name`);
    }
    return this.__name;
  }

  attr(name: ActionAttribute, value: unknown): this {
    this.#attrs.set(name, value);
    return this;
  }

  privateAttr(): this {
    return this.attr(ActionAttribute.isPrivate, true);
  }

  toString(): string {
    let str = `${toTypeString(this)}(${this.__name}, ${this.__groupTable})`;
    if (this.__sqlTable && this.__sqlTable !== this.__groupTable) {
      str += `(${this.__sqlTable})`;
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
    if (!this.__name) {
      this.#name = name;
    }
    if (!this.__groupTable) {
      this.#groupTable = groupTable;
    }
    this.validate(this.__groupTable || groupTable);
  }
}

// An empty action is ignored in `enumerateActions`.
export const emptyAction = new Action(ActionType.select);

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
