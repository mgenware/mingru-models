import { ActionType } from './ta';
import { SQL } from '../core/sql';
import { CoreSelectAction } from './coreSelectAction';
import { Table } from '../core/core';

export class DeleteAction extends CoreSelectAction {
  whereSQL: SQL | null = null;

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
        `'allowNoWhere' is set to false, you must define an WHERE clause. Otherwise, use 'unsafeDeleteAll'`,
      );
    }
  }
}
