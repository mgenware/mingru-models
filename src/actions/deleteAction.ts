import { ActionType } from './tableActions';
import { CoreSelectAction } from './coreSelectAction';
import { Table } from '../core/core';

export class DeleteAction extends CoreSelectAction {
  constructor(
    public readonly allowNoWhere: boolean,
    // Make sure only one row is affected, used by `deleteOne`.
    public readonly ensureOneRowAffected: boolean,
  ) {
    super(ActionType.delete);
  }

  validate(groupTable: Table) {
    super.validate(groupTable);
    if (!this.allowNoWhere && !this.whereSQLValue) {
      throw new Error(
        '`allowNoWhere` is set to false, you must define a WHERE clause. Otherwise, use `unsafeDeleteAll`',
      );
    }
  }
}
