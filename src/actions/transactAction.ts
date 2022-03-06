import { Table } from '../core/core.js';
import { Action, ActionData, ActionType } from './tableActions.js';
import { throwOnEmptyArray } from '../lib/arrayUtil.js';

export class ActionWithReturnValues {
  constructor(
    public readonly action: Action,
    public readonly returnValues: Readonly<Record<string, string | undefined>>,
  ) {}
}

export type TransactionMemberTypes = TransactionMember | Action | ActionWithReturnValues;

export class TransactionMember {
  constructor(
    public readonly action: Action,
    public readonly name?: string,
    public readonly returnValues?: Readonly<Record<string, string | undefined>>,
  ) {}
}

export interface TransactActionData extends ActionData {
  members?: TransactionMember[];
  returnValues?: string[];
}

export class TransactAction extends Action {
  #data = this.__data as TransactActionData;
  __getData(): TransactActionData {
    return this.#data;
  }

  constructor(members: TransactionMember[]) {
    super(ActionType.transact);
    throwOnEmptyArray(members, 'members');

    this.#data.members = members;
  }

  override __validate(groupTable: Table) {
    super.__validate(groupTable);
    if (this.#data.members) {
      for (const mem of this.#data.members) {
        const mAction = mem.action;
        mAction.__validate(groupTable);
      }
    }
  }

  setReturnValues(...values: string[]): this {
    throwOnEmptyArray(values, 'values');

    this.#data.returnValues = values;
    return this;
  }
}
