import { throwIfFalsy } from 'throw-if-arg-empty';
import { Table } from '../core/core';
import { Action, ActionType } from './tableActions';

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

export class TransactAction extends Action {
  #returnValues?: string[];
  get returnValues(): ReadonlyArray<string> | undefined {
    return this.#returnValues;
  }

  constructor(public readonly members: ReadonlyArray<TransactionMember>) {
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

    this.#returnValues = values;
    return this;
  }
}
