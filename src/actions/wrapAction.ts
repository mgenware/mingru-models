import { Action, ActionData, ActionGroup, ActionType } from './actionGroup.js';
import { Table } from '../core/core.js';
import * as su from '../lib/stringUtil.js';

// Capture a variable from outer scope.
export class CapturedVar {
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
    return su.desc(this, this.path);
  }
}

export function captureVar(name: string): CapturedVar {
  return new CapturedVar(name);
}

export class RenameArg {
  constructor(public name: string) {}
}

export function renameArg(name: string): RenameArg {
  return new RenameArg(name);
}

export type WrapArgValue = string | number | Table | CapturedVar | RenameArg | null;

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

    if (Object.entries(args).length === 0) {
      throw new Error('"args" cannot be empty');
    }
    this.#data.innerAction = innerAction;
    this.#data.args = args;
  }

  override __configure(name: string, ag: ActionGroup, inline: boolean) {
    super.__configure(name, ag, inline);

    this.__getData().innerAction?.__configure(`${name}Core`, ag, true);
  }

  __setArgs(args: Record<string, WrapArgValue>) {
    this.#data.args = args;
  }
}
