import { ActionType } from './tableActions';
import { CoreSelectAction, CoreSelectionActionData } from './coreSelectAction';
import { Table } from '../core/core';

export interface DeleteActionData extends CoreSelectionActionData {
  // Allow deleting all rows (without a WHERE clause).
  unsafeMode?: boolean;
  // Make sure only one row is affected, used by `deleteOne`.
  ensureOneRowAffected?: boolean;
}

export class DeleteAction extends CoreSelectAction {
  private get data(): DeleteActionData {
    return this.__data;
  }

  constructor(unsafeMode: boolean, ensureOneRowAffected: boolean) {
    super(ActionType.delete);

    this.data.unsafeMode = unsafeMode;
    this.data.ensureOneRowAffected = ensureOneRowAffected;
  }

  validate(groupTable: Table) {
    super.validate(groupTable);
    if (!this.data.unsafeMode && !this.data.whereSQLValue) {
      throw new Error(
        '`unsafeMode` is not on, you must define a WHERE clause. Otherwise, use `unsafeDeleteAll`',
      );
    }
  }
}
