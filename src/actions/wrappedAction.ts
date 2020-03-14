import { Action, ActionType, initializeAction } from './tableActions';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { Table } from '../core/core';
import camelCase = require('lodash.camelcase');

// Use this to reference an external from outer context.
export class ValueRef {
  // Returns the first variable name if path contains property access.
  firstName: string;
  hasPropertyAccess: boolean;

  constructor(public path: string) {
    const nameComponents = path.split('.');
    this.firstName = nameComponents[nameComponents.length - 1];
    if (nameComponents.length > 1) {
      // Use lowercase name for property access input.
      this.firstName = camelCase(nameComponents[0]);
      this.hasPropertyAccess = true;
    } else {
      this.hasPropertyAccess = false;
    }
  }

  toString(): string {
    return `ValueRef(${this.path})`;
  }
}

export function valueRef(name: string): ValueRef {
  return new ValueRef(name);
}

export class WrappedAction extends Action {
  isTemp = false;

  constructor(
    public action: Action,
    public args: { [name: string]: string | ValueRef },
  ) {
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
