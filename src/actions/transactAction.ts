import { Action, ActionData, ActionGroup, ActionType } from './actionGroup.js';
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

  override __configure(name: string, ag: ActionGroup, inline: boolean) {
    super.__configure(name, ag, inline);

    let i = 0;
    if (this.#data.members) {
      for (const mem of this.#data.members) {
        i++;
        const mAction = mem.action;
        mAction.__configure(`${name}Child${i}`, ag, true);
      }
    }
  }

  setReturnValues(...values: string[]): this {
    throwOnEmptyArray(values, 'values');

    this.#data.returnValues = values;
    return this;
  }
}
