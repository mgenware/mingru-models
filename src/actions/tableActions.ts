import { throwIfFalsy } from 'throw-if-arg-empty';
import toTypeString from 'to-type-string';
import { Table, CoreProperty } from '../core/core';
import * as defs from '../core/defs';
import Utils from '../lib/utils';
import { SQLVariable } from '../core/sql';

export class TableActions {
  __table: Table | null = null;
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
  // Will be set after calling mm.ta. Can be overwritten by from().
  __table: Table | null = null;

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
      throw new Error(`Action "${toTypeString(this)}" is not initialized`);
    }
    return [this.__table, this.__name];
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

export interface EnumerateActionsOptions {
  sorted?: boolean;
}

export function enumerateActions<T extends TableActions>(
  ta: T,
  cb: (action: Action, prop: string) => void,
  opts?: EnumerateActionsOptions,
) {
  throwIfFalsy(ta, 'ta');

  // eslint-disable-next-line no-param-reassign
  opts = opts || {};
  if (!cb) {
    return;
  }

  const entries = Object.entries(ta);
  if (opts.sorted) {
    entries.sort((a, b) => Utils.compareStrings(a[0], b[0]));
  }
  for (const pair of entries) {
    const name = pair[0] as string;
    const value = pair[1];
    // Ignore internal props and functions
    if (
      name.startsWith(defs.InternalPropPrefix) ||
      typeof value === 'function'
    ) {
      continue;
    }
    if (value instanceof Action === false) {
      throw new Error(
        `The property "${name}" is not an Action, got "${toTypeString(value)}"`,
      );
    }
    cb(value, name);
  }
}

export function initializeAction(action: Action, table: Table, name: string) {
  throwIfFalsy(action, 'action');
  // eslint-disable-next-line no-param-reassign
  action.__name = name;
  // action.__table can be set before initialization by from()
  if (action.__table) {
    // eslint-disable-next-line no-param-reassign
    table = action.__table;
  } else {
    // eslint-disable-next-line no-param-reassign
    action.__table = table;
  }
  // After all properties are set, run property handlers
  CoreProperty.runHandlers(action);
  // Run validate callback
  action.validate(table, name);
}

export function tableActions<T extends Table, A extends TableActions>(
  table: T,
  TACls: new () => A,
): A {
  throwIfFalsy(table, 'table');
  const group = new TACls();
  group.__table = table;
  enumerateActions(group, (action, name) => {
    try {
      initializeAction(action, table, name);
    } catch (err) {
      err.message += ` [action "${name}"]`;
      throw err;
    }
  });
  return group;
}
