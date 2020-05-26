import { throwIfFalsy } from 'throw-if-arg-empty';
import { Action, ActionType, initializeAction } from './tableActions';
import { Table } from '../core/core';

export class ActionWithReturnValues {
  constructor(
    public action: Action,
    public returnValues: { [name: string]: string },
  ) {}
}

export type TransactionMemberTypes =
  | TransactionMember
  | Action
  | ActionWithReturnValues;

export class TransactionMember {
  // True if this member is created inside transaction function block.
  isTemp = false;

  constructor(
    public action: Action,
    public name?: string,
    public returnValues?: { [name: string]: string },
  ) {
    throwIfFalsy(action, 'action');
  }
}

export class TransactAction extends Action {
  __returnValues?: string[];

  constructor(public members: TransactionMember[]) {
    super(ActionType.transact);
    throwIfFalsy(members, 'members');
  }

  validate(table: Table, name: string) {
    super.validate(table, name);

    // Initialize member actions.
    let idx = 1;
    for (const mem of this.members) {
      const mAction = mem.action;
      if (!mAction.__name) {
        initializeAction(mAction, table, mem.name || `${name}Child${idx}`);
        mem.isTemp = true;
      }
      idx++;
    }
  }

  setReturnValues(...values: string[]): this {
    throwIfFalsy(values, 'values');

    this.__returnValues = values;
    return this;
  }
}
