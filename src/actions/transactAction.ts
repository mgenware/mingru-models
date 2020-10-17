import { throwIfFalsy } from 'throw-if-arg-empty';
import { Action, ActionType } from './tableActions';
import { Table } from '../core/core';

export class ActionWithReturnValues {
  constructor(public action: Action, public returnValues: { [name: string]: string }) {}
}

export type TransactionMemberTypes = TransactionMember | Action | ActionWithReturnValues;

export class TransactionMember {
  // True if this member is created inside transaction function block.
  isInline = false;

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

  validate(table: Table) {
    super.validate(table);

    for (const mem of this.members) {
      const mAction = mem.action;
      mAction.validate(table);
    }
  }

  setReturnValues(...values: string[]): this {
    throwIfFalsy(values, 'values');

    this.__returnValues = values;
    return this;
  }
}
