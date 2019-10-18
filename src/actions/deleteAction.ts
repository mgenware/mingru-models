import { ActionType } from './ta';
import { CoreSelectAction } from './coreSelectAction';
import { Table } from '../core/core';

export class DeleteAction extends CoreSelectAction {
  constructor(
    public allowNoWhere: boolean,
    public ensureOneRowAffected: boolean, // Make sure only one row is affected, used by `updateOne`
  ) {
    super(ActionType.delete);
  }

  validate(table: Table, name: string) {
    super.validate(table, name);
    if (!this.allowNoWhere && !this.whereSQL) {
      throw new Error(
        '`allowNoWhere` is set to false, you must define a WHERE clause. Otherwise, use `unsafeDeleteAll`',
      );
    }
  }
}
