import { Action, ActionType, initializeAction } from './ta';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { Table } from '../core/core';

// Use this to reference the value saved by `Action.saveReturnValue`.
export class SavedContextValue {
  constructor(public name: string) {}
}

export class WrappedAction extends Action {
  isTemp = false;

  constructor(public action: Action, public args: { [name: string]: unknown }) {
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
      // e.g. mm.wrap(mm.insert(...))
      // NOTE: action must be initialized to function properly
      initializeAction(this.action, table, name);
      this.isTemp = true;
    }
  }
}
