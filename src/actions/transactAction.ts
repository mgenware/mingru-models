import { Action, ActionType, initializeAction } from './tableActions';
import { throwIfFalsy } from 'throw-if-arg-empty';
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
    public name: string | undefined,
    public returnValues: { [name: string]: string },
  ) {
    throwIfFalsy(action, 'action');
  }
}

export class TransactAction extends Action {
  constructor(public members: TransactionMember[], public resultName?: string) {
    super(ActionType.transact);
    throwIfFalsy(members, 'members');
  }

  validate(table: Table, name: string) {
    super.validate(table, name);

    // Initialize member actions
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
}
