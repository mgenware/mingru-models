import { Table, CoreProperty } from '../core/core';
import { throwIfFalsy } from 'throw-if-arg-empty';
import * as defs from '../core/defs';
import toTypeString from 'to-type-string';
import Utils from '../lib/utils';
import { SQLInputList } from '../core/sql';

export class TA {
  __table!: Table;
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
  // Will be set in dd.ta
  __table!: Table;

  constructor(public actionType: ActionType) {
    super();
  }

  // After action is fully initialized, `dd.ta` will call `Action.validate`
  validate() {
    // Implemented by sub-classes
  }

  getInputs(): SQLInputList {
    throw new Error('Not implemented yet');
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

export function ta<T extends Table, A extends TA>(
  table: T,
  taCls: new () => A,
): A {
  throwIfFalsy(table, 'table');
  const group = new taCls();
  group.__table = table;
  enumerateActions(group, (action, prop) => {
    action.__name = prop;
    action.__table = table;
    // After all properties are set, run property handlers
    CoreProperty.runHandlers(action);
    // Validate this action
    action.validate();
  });
  return group;
}
