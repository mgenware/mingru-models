/* eslint-disable no-param-reassign */
import { throwIfFalsy } from 'throw-if-arg-empty';
import toTypeString from 'to-type-string';
import { Table, CoreProperty } from '../core/core';
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

export class Action extends CoreProperty {
  // `__table` and `__rootTable` are set after calling `mm.ta`.
  // `__table` can be changed by `from()`.
  __table: Table | null = null;
  __rootTable: Table | null = null;

  __argStubs: SQLVariable[] = [];
  __attrs: { [name: string]: unknown } = {};

  // Whether `__init` has been called.
  __loaded = false;

  constructor(public actionType: ActionType) {
    super();
  }

  from(table: Table): this {
    this.__table = table;
    return this;
  }

  argStubs(...args: SQLVariable[]): this {
    this.__argStubs = args;
    return this;
  }

  mustGetTable(): Table {
    this.ensureInitialized();
    if (!this.__table) {
      throw new Error(`Action "${toTypeString(this)}" doesn't have a table`);
    }
    return this.__table;
  }

  mustGetName(): string {
    this.ensureInitialized();
    if (!this.__name) {
      throw new Error(`Action "${toTypeString(this)}" doesn't have a name`);
    }
    return this.__name;
  }

  ensureInitialized() {
    if (!this.__loaded) {
      throw new Error(
        `Table action not initialized, type "${toTypeString(this)}", name "${toTypeString(
          this.__name,
        )}", table "${toTypeString(this.__table)}"`,
      );
    }
  }

  attrs(values: { [name: string]: unknown }): this {
    this.__attrs = { ...this.__attrs, ...values };
    return this;
  }

  attr(name: string, value: unknown): this {
    this.attrs({ [name]: value });
    return this;
  }

  toString(): string {
    return `${toTypeString(this)}(${this.__name}, ${this.__table})`;
  }

  // Automatically called by `mm.ta` for all the columns it walks through.
  // Once an action is inited, its `__table` is set.
  // IMPORTANT: Action `__init` must be called to have the `onInit` run, the
  // `onInit` contains required code for many actions. It also calls handlers
  // registered by `CoreProperty.registerHandler`.
  /**
   * Root table, table and name:
   * class RootTable {
   *   name = mm.select().from(table);
   * }
   */
  __init(table: Table, name: string | null) {
    if (this.__loaded) {
      return;
    }

    this.__loaded = true;
    // Do not overwrite existing values.
    if (!this.__table) {
      // `__table` can also be set by `from` method.
      this.__table = table;
    }
    if (!this.__name) {
      this.__name = name;
    }
    if (!this.__rootTable) {
      this.__rootTable = table;
    }
    // After all properties are set, run property handlers.
    CoreProperty.runHandlers(this);

    // Run `onLoad` callback.
    this.onLoad(this.__table, this.__rootTable, name);
  }

  // Called by `__init`.
  // eslint-disable-next-line class-methods-use-this
  protected onLoad(_table: Table, _rootTable: Table, _name: string | null) {
    // Implemented by subclass.
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
      action.__init(table, name);
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
