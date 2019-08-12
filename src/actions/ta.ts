import { Table, CoreProperty } from '../core/core';
import { throwIfFalsy } from 'throw-if-arg-empty';
import * as defs from '../core/defs';
import toTypeString from 'to-type-string';
import Utils from '../lib/utils';
import { SQLVariable } from '../core/sql';

export class TA {
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
  // Will be set after calling dd.ta
  __table: Table | null = null;

  __argStubs: SQLVariable[] = [];

  constructor(public actionType: ActionType) {
    super();
  }

  // After action is fully initialized, `dd.ta` will call `Action.validate`
  validate(_: Table, __: string) {
    // Implemented by sub-classes
  }

  argStubs(...args: SQLVariable[]): this {
    this.__argStubs = args;
    return this;
  }
}

export interface EnumerateActionsOptions {
  sorted?: boolean;
}

export function enumerateActions<T extends TA>(
  tableActions: T,
  cb: (action: Action, prop: string) => void,
  opts?: EnumerateActionsOptions,
) {
  throwIfFalsy(tableActions, 'tableActions');

  opts = opts || {};
  if (!cb) {
    return;
  }

  const entries = Object.entries(tableActions);
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
        `The property "${name}" is not a Action object, got "${toTypeString(
          value,
        )}"`,
      );
    }
    const col = value as Action;
    cb(col, name);
  }
}

export function initializeAction(action: Action, table: Table, name: string) {
  throwIfFalsy(action, 'action');
  action.__name = name;
  action.__table = table;
  // After all properties are set, run property handlers
  CoreProperty.runHandlers(action);
  // Run validate callback
  action.validate(table, name);
}

export function ta<T extends Table, A extends TA>(
  table: T,
  taCls: new () => A,
): A {
  throwIfFalsy(table, 'table');
  const group = new taCls();
  group.__table = table;
  enumerateActions(group, (action, name) => {
    initializeAction(action, table, name);
  });
  return group;
}
