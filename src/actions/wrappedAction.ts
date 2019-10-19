import { Action, ActionType, initializeAction } from './ta';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { Table } from '../core/core';

// Use this to reference the value saved by `Action.saveReturnValue`.
export class SavedContextValue {
  constructor(public name: string) {}
}

export class WrappedAction extends Action {
  isTemp = false;

  constructor(
    public action: Action,
    table: Table | null,
    public args: { [name: string]: unknown },
  ) {
    super(ActionType.wrap);
    throwIfFalsy(action, 'action');
    throwIfFalsy(args, 'args');

    if (Object.entries(args).length === 0) {
      throw new Error('"args" cannot be empty');
    }

    if (table) {
      this.__table = table;
    }
  }

  validate(table: Table, name: string) {
    super.validate(table, name);

    // Initialize wrapped action if needed
    if (!this.action.__name) {
      initializeAction(this.action, table, name);
      this.isTemp = true;
    }
  }
}
