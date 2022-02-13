import { throwIfFalsy } from 'throw-if-arg-empty';
import { Action, ActionData, ActionType } from './tableActions.js';
import { Table } from '../core/core.js';

// Used to reference an external variable from outer context.
export class ValueRef {
  // Returns the first variable name if `this.path` contains property access.
  readonly firstName: string;
  readonly hasPropertyAccess: boolean;

  constructor(public readonly path: string) {
    const nameComponents = path.split('.');
    const name = nameComponents[nameComponents.length - 1];
    if (!name) {
      throw new Error('Unexpected empty name');
    }
    this.firstName = name;
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

export class RenameArg {
  constructor(public name: string) {}
}

export function renameArg(name: string): RenameArg {
  return new RenameArg(name);
}

export type WrapArgValue = string | number | Table | ValueRef | RenameArg | null;

export interface WrapActionData extends ActionData {
  args?: Record<string, WrapArgValue>;
  innerAction?: Action;
}

export class WrapAction extends Action {
  #data = this.__data as WrapActionData;
  __getData(): WrapActionData {
    return this.#data;
  }

  constructor(innerAction: Action, args: Readonly<Record<string, WrapArgValue>>) {
    super(ActionType.wrap);
    throwIfFalsy(innerAction, 'innerAction');
    throwIfFalsy(args, 'args');

    if (Object.entries(args).length === 0) {
      throw new Error('"args" cannot be empty');
    }
    this.#data.innerAction = innerAction;
    this.#data.args = args;
  }

  override __validate(groupTable: Table) {
    super.__validate(groupTable);

    this.#data.innerAction?.__validate(groupTable);
  }

  __setArgs(args: Record<string, WrapArgValue>) {
    this.#data.args = args;
  }
}
