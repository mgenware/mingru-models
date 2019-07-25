import { Action, ActionType } from './ta';
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
    super.validate(table, name);

    // If member.__table is empty, that indicates it was created inside dd.transact.
    for (const m of this.members) {
      const mAction = m.action;
      if (!mAction.__table) {
        mAction.__table = table;
      }
    }
  }
}
