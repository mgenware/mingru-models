import { ActionType } from './ta';
import { SQL } from '../core/sql';
import CoreSelectAction from './coreSelectAction';

export default class DeleteAction extends CoreSelectAction {
  whereSQL: SQL | null = null;

  constructor(
    public allowNoWhere: boolean,
    public checkOnlyOneAffected: boolean, // Make sure only one row is affected, used by `updateOne`
  ) {
    super(ActionType.delete);
  }

  validate() {
    super.validate();
    if (!this.allowNoWhere && !this.whereSQL) {
      throw new Error(
        `'allowNoWhere' is set to false, you must define an WHERE clause. Otherwise, use 'unsafeDeleteAll'`,
      );
    }
  }
}
