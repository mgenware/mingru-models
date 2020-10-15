/* eslint-disable no-param-reassign */
import { throwIfFalsy } from 'throw-if-arg-empty';
import toTypeString from 'to-type-string';
import { Table, CoreProperty } from '../core/core';
import * as defs from '../core/defs';
import { SQLVariable } from '../core/sql';

export class TableActions {
  __table: Table | null = null;
  __actions: Record<string, Action> = {};

  ensureInitialized(): Table {
    if (!this.__table) {
      throw new Error(`Action actions "${toTypeString(this)}" not initialized`);
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

  constructor(public actionType: ActionType) {
    super();
  }

  from(table: Table): this {
    this.__table = table;
    return this;
  }

  // After action is fully initialized, `mm.ta` will call `Action.validate`
  // eslint-disable-next-line class-methods-use-this
  validate(_table: Table, _name: string) {
    // Implemented by sub-classes
  }

  argStubs(...args: SQLVariable[]): this {
    this.__argStubs = args;
    return this;
  }

  ensureInitialized(): [Table, string] {
    if (!this.__name || !this.__table) {
      throw new Error(
        `Action "${toTypeString(this)}" not initialized, ${
          !this.__name ? 'empty name' : 'empty table'
        }`,
      );
    }
    return [this.__table, this.__name];
  }

  mustGetTable(): Table {
    const [table] = this.ensureInitialized();
    return table;
  }

  mustGetName(): string {
    const [, name] = this.ensureInitialized();
    return name;
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

export function initializeAction(action: Action, table: Table, name: string) {
  throwIfFalsy(action, 'action');
  action.__name = name;
  action.__rootTable = table;
  // `action.__table` can be set before initialization by `from()`.
  if (action.__table) {
    table = action.__table;
  } else {
    action.__table = table;
  }
  // After all properties are set, run property handlers.
  CoreProperty.runHandlers(action);
  // Run validate callback.
  action.validate(table, name);
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
      initializeAction(action, table, name);
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
