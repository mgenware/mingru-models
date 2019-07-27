import { Action, ActionType, initializeAction } from './ta';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { Table } from '../core/core';

export class WrappedAction extends Action {
  constructor(
    public action: Action,
    // tslint:disable-next-line no-any
    public args: { [name: string]: any },
  ) {
    super(ActionType.wrap);
    throwIfFalsy(action, 'action');
    throwIfFalsy(args, 'args');

    if (Object.entries(args).length === 0) {
      throw new Error('"args" cannot be empty');
    }
  }

  validate(table: Table, name: string) {
    // Initialize wrapped action if it hasn't done it yet
    if (!this.action.__name) {
      // For an uninitialized wrapped action, table and name default to parent's equivalent,
      // e.g. dd.wrap(dd.insert(...))
      initializeAction(this.action, table, name);
    }
  }
}
