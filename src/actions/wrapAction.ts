import { throwIfFalsy } from 'throw-if-arg-empty';
import camelCase from 'lodash.camelcase';
import { Action, ActionType } from './tableActions';
import { Table } from '../core/core';

export type WrapActionArgValue = string | ValueRef;

// Use this to reference an external from outer context.
export class ValueRef {
  // Returns the first variable name if path contains property access.
  readonly firstName: string;
  readonly hasPropertyAccess: boolean;

  constructor(public readonly path: string) {
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

export class WrapAction extends Action {
  constructor(
    public readonly action: Action,
    public readonly args: Readonly<Record<string, WrapActionArgValue>>,
  ) {
    super(ActionType.wrap);
    throwIfFalsy(action, 'action');
    throwIfFalsy(args, 'args');

    if (Object.entries(args).length === 0) {
      throw new Error('"args" cannot be empty');
    }
  }

  validate(groupTable: Table) {
    super.validate(groupTable);

    const { action } = this;
    action.validate(groupTable);
  }
}
