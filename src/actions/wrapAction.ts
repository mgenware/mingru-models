import { throwIfFalsy } from 'throw-if-arg-empty';
import { Action, ActionData, ActionType } from './tableActions';
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

export interface WrapActionData extends ActionData {
  args?: Record<string, WrapActionArgValue>;
  innerAction?: Action;
}

export class WrapAction extends Action {
  private get data(): WrapActionData {
    return this.__data;
  }

  constructor(innerAction: Action, args: Readonly<Record<string, WrapActionArgValue>>) {
    super(ActionType.wrap);
    throwIfFalsy(innerAction, 'innerAction');
    throwIfFalsy(args, 'args');

    if (Object.entries(args).length === 0) {
      throw new Error('"args" cannot be empty');
    }
    this.data.innerAction = innerAction;
    this.data.args = args;
  }

  validate(groupTable: Table) {
    super.validate(groupTable);

    this.data.innerAction?.validate(groupTable);
  }
}
