import { Action, ActionType, initializeAction } from './ta';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { Table } from '../core/core';

export type TransactionMemberHelper = TransactionMember | Action;

export class TransactionMember {
  constructor(public action: Action, public name?: string) {
    throwIfFalsy(action, 'action');
  }
}

export class TransactAction extends Action {
  constructor(public members: TransactionMember[], public resultName?: string) {
    super(ActionType.transact);
    throwIfFalsy(members, 'members');
  }

  validate(table: Table, name: string) {
    // Initialize member actions
    let idx = 0;
    for (const mem of this.members) {
      const mAction = mem.action;
      if (!mAction.__name) {
        initializeAction(mAction, table, mem.name || `${name}Child${idx}`);
      }
      idx++;
    }
  }
}
