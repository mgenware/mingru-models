import { ActionType } from './tableActions';
import { CoreSelectAction } from './coreSelectAction';
import { Table } from '../core/core';

export class DeleteAction extends CoreSelectAction {
  constructor(
    public allowNoWhere: boolean,
    // Make sure only one row is affected, used by `updateOne`.
    public ensureOneRowAffected: boolean,
  ) {
    super(ActionType.delete);
  }

  onLoad(table: Table, rootTable: Table, name: string | null) {
    super.onLoad(table, rootTable, name);
    if (!this.allowNoWhere && !this.whereSQLValue) {
      throw new Error(
        '`allowNoWhere` is set to false, you must define a WHERE clause. Otherwise, use `unsafeDeleteAll`',
      );
    }
  }
}
