import { throwIfFalsy } from 'throw-if-arg-empty';
import { Action, ActionType } from './tableActions';
import { Table } from '../core/core';

export type WrapActionArgValue = string | ValueRef | Table;

// Use this to reference an external from outer context.
export class ValueRef {
  // Returns the first variable name if path contains property access.
  readonly firstName: string;
  readonly hasPropertyAccess: boolean;

  constructor(public readonly path: string) {
    const nameComponents = path.split('.');
    this.firstName = nameComponents[nameComponents.length - 1];
    if (nameComponents.length > 1) {
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
  #args: Readonly<Record<string, WrapActionArgValue>>;
  get args(): Readonly<Record<string, WrapActionArgValue>> {
    return this.#args;
  }

  // Called by table action extensions.
  __setArgs(args: Readonly<Record<string, WrapActionArgValue>>) {
    this.#args = args;
  }

  constructor(public readonly action: Action, args: Readonly<Record<string, WrapActionArgValue>>) {
    super(ActionType.wrap);
    throwIfFalsy(action, 'action');
    throwIfFalsy(args, 'args');

    if (Object.entries(args).length === 0) {
      throw new Error('"args" cannot be empty');
    }
    this.#args = args;
  }

  validate(groupTable: Table) {
    super.validate(groupTable);

    const { action } = this;
    action.validate(groupTable);
  }
}
