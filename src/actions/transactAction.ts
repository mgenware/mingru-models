import { Action, ActionType } from './ta';
import { throwIfFalsy } from 'throw-if-arg-empty';

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
}
