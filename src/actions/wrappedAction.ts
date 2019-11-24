import { Action, ActionType, initializeAction } from './tableActions';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { Table } from '../core/core';

// Use this to use a value set by `.declareReturnValues` in a transaction.
export class ReturnValueDef {
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
    super.validate(table, name);

    const { action } = this;
    // Initialize wrapped action if needed
    if (!action.__name) {
      initializeAction(action, table, name);
      this.isTemp = true;
    }
  }
}
