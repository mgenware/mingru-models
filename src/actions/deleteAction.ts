import { ActionType } from './ta';
import { SQL, SQLInputList } from '../core/sql';
import CoreSelectAction from './coreSelectAction';

export default class DeleteAction extends CoreSelectAction {
  whereSQL: SQL | null = null;

  constructor(public allowNoWhere: boolean, public checkAffectedRows: boolean) {
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

  getInputs(): SQLInputList {
    if (this.whereSQL) {
      return this.whereSQL.inputs;
    }
    return new SQLInputList();
  }
}
