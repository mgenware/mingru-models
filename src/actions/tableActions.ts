/* eslint-disable no-param-reassign */
import { throwIfFalsy } from 'throw-if-arg-empty';
import toTypeString from 'to-type-string';
import { Table } from '../core/core';
import * as defs from '../core/defs';
import { SQLVariable } from '../core/sql';

export class TableActions {
  __table: Table | null = null;
  __actions: Record<string, Action> = {};

  mustGetTable(): Table {
    if (!this.__table) {
      throw new Error(`TableActions "${toTypeString(this)}" doesn't have a table`);
    }
    return this.__table;
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

  // `__table` and `__rootTable` will be set after calling `mm.tableActions`.
  // `__table` can be changed by `from()`.
  #table: Table | null = null;
  get __table(): Table | null {
    return this.#table;
  }

  #rootTable: Table | null = null;
  get __rootTable(): Table | null {
    return this.#rootTable;
  }

  #argStubs: SQLVariable[] = [];
  get __argStubs(): ReadonlyArray<SQLVariable> {
    return this.#argStubs;
  }

  #attrs: { [name: string]: unknown } = {};
  get __attrs(): Readonly<Record<string, unknown>> {
    return this.#attrs;
  }

  constructor(public actionType: ActionType) {}

  from(table: Table): this {
    this.#table = table;
    return this;
  }

  argStubs(...args: SQLVariable[]): this {
    this.#argStubs = args;
    return this;
  }

  mustGetTable(): Table {
    if (!this.__table) {
      throw new Error(`Action "${toTypeString(this)}" doesn't have a table`);
    }
    return this.__table;
  }

  mustGetName(): string {
    if (!this.__name) {
      throw new Error(`Action "${toTypeString(this)}" doesn't have a name`);
    }
    return this.__name;
  }

  attrs(values: { [name: string]: unknown }): this {
    this.#attrs = { ...this.__attrs, ...values };
    return this;
  }

  attr(name: string, value: unknown): this {
    this.attrs({ [name]: value });
    return this;
  }

  toString(): string {
    return `${toTypeString(this)}(${this.__name}, ${this.__table})`;
  }

  // Automatically called by `mm.tableActions` for all the columns it walks through.
  // Actions are immutable. Actions touched by `mm.tableActions` will have `__table`
  // `__rootTable` and `__name` set, and have `validate` called automatically.
  // Other actions, such ones embedded in SQL exprs cannot be handled by `ta.tableActions`,
  // thus have to be manually taken care of.
  // `boundTable` every action should be validated, but not all actions have `__table`
  // set, like mentioned above. In `validate`, use `boundTable` as a fallback table value
  // to `__table`. Example: INSERT action uses `this.__table || boundTable` to check
  // whether setter columns belong to the parent column, and it works for SQL subqueries.
  // eslint-disable-next-line class-methods-use-this
  validate(_boundTable: Table) {
    // Implemented by subclass.
  }

  // Called by `ta.tableActions`.
  __configure(table: Table, name: string) {
    if (!this.__name) {
      this.#name = name;
    }
    if (!this.__rootTable) {
      this.#rootTable = table;
    }
    if (!this.__table) {
      this.#table = table;
    }
    this.validate(this.__table || table);
  }
}

function enumerateActions<T extends TableActions>(
  ta: T,
  cb: (action: Action, prop: string) => void,
) {
  throwIfFalsy(ta, 'ta');

  const entries = Object.entries(ta);
  for (const pair of entries) {
    const name = pair[0] as string;
    const value = pair[1];
    // Ignore internal props and functions.
    if (name.startsWith(defs.InternalPropPrefix) || typeof value === 'function') {
      continue;
    }
    if (value instanceof Action === false) {
      let valueDesc = '';
      try {
        valueDesc = toTypeString(value);
      } catch (err) {
        valueDesc = `Error getting object description: ${err.message}`;
      }
      throw new Error(`The property "${name}" is not an Action, got "${valueDesc}"`);
    }
    cb(value, name);
  }
}

export function tableActionsCore(
  table: Table,
  taObj: TableActions | null,
  actions: Record<string, Action>,
): TableActions {
  throwIfFalsy(table, 'table');

  taObj = taObj || new TableActions();
  taObj.__table = table;
  for (const [name, action] of Object.entries(actions)) {
    try {
      action.__configure(table, name);
    } catch (err) {
      err.message += ` [action "${name}"]`;
      throw err;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (taObj as any)[name] = action;
  }
  taObj.__actions = actions;

  return taObj;
}

export function tableActions<T extends Table, A extends TableActions>(
  table: T,
  TACls: new () => A,
): A {
  throwIfFalsy(table, 'table');

  try {
    const taObj = new TACls();
    const actions: Record<string, Action> = {};
    enumerateActions(taObj, (action, name) => {
      actions[name] = action;
    });
    return tableActionsCore(table, taObj, actions) as A;
  } catch (err) {
    err.message += ` [table "${table}"]`;
    throw err;
  }
}
