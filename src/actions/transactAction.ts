import { throwIfFalsy } from 'throw-if-arg-empty';
import { Table } from '../core/core';
import { Action, ActionType } from './tableActions';

export class ActionWithReturnValues {
  constructor(public action: Action, public returnValues: { [name: string]: string }) {}
}

export type TransactionMemberTypes = TransactionMember | Action | ActionWithReturnValues;

export class TransactionMember {
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

  validate(groupTable: Table) {
    super.validate(groupTable);

    for (const mem of this.members) {
      const mAction = mem.action;
      mAction.validate(groupTable);
    }
  }

  setReturnValues(...values: string[]): this {
    throwIfFalsy(values, 'values');

    this.__returnValues = values;
    return this;
  }
}
