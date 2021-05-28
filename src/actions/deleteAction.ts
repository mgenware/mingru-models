import { ActionType } from './tableActions.js';
import { CoreSelectAction, CoreSelectionActionData } from './coreSelectAction.js';
import { Table } from '../core/core.js';

export interface DeleteActionData extends CoreSelectionActionData {
  // Allow deleting all rows (without a WHERE clause).
  unsafeMode?: boolean;
  // Make sure only one row is affected, used by `deleteOne`.
  ensureOneRowAffected?: boolean;
}

export class DeleteAction extends CoreSelectAction {
  #data = this.__data as DeleteActionData;
  __getData(): DeleteActionData {
    return this.#data;
  }

  constructor(unsafeMode: boolean, ensureOneRowAffected: boolean) {
    super(ActionType.delete);

    this.#data.unsafeMode = unsafeMode;
    this.#data.ensureOneRowAffected = ensureOneRowAffected;
  }

  override __validate(groupTable: Table) {
    super.__validate(groupTable);
    if (!this.#data.unsafeMode && !this.#data.whereSQLValue) {
      throw new Error(
        '`unsafeMode` is not on, you must define a WHERE clause. Otherwise, use `unsafeDeleteAll`',
      );
    }
  }
}
