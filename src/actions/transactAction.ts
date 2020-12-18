import { throwIfFalsy } from 'throw-if-arg-empty';
import { Table } from '../core/core';
import { Action, ActionData, ActionType } from './tableActions';

export class ActionWithReturnValues {
  constructor(
    public readonly action: Action,
    public readonly returnValues: Readonly<Record<string, string>>,
  ) {}
}

export type TransactionMemberTypes = TransactionMember | Action | ActionWithReturnValues;

export class TransactionMember {
  constructor(
    public readonly action: Action,
    public readonly name?: string,
    public readonly returnValues?: Readonly<Record<string, string>>,
  ) {
    throwIfFalsy(action, 'action');
  }
}

export interface TransactActionData extends ActionData {
  members?: TransactionMember[];
  returnValues?: string[];
}

export class TransactAction extends Action {
  private get data(): TransactActionData {
    return this.__data;
  }

  constructor(members: TransactionMember[]) {
    super(ActionType.transact);
    throwIfFalsy(members, 'members');

    this.data.members = members;
  }

  validate(groupTable: Table) {
    super.validate(groupTable);
    if (this.data.members) {
      for (const mem of this.data.members) {
        const mAction = mem.action;
        mAction.validate(groupTable);
      }
    }
  }

  setReturnValues(...values: string[]): this {
    throwIfFalsy(values, 'values');

    this.data.returnValues = values;
    return this;
  }
}
