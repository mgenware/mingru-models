import { ActionType } from './ta';
import { SQL } from '../core/sql';
import CoreSelectAction from './coreSelectAction';

export default class DeleteAction extends CoreSelectAction {
  whereSQL: SQL | null = null;

  constructor(public deleteAll: boolean, public checkAffectedRows: boolean) {
    super(ActionType.delete);
    this.whereValidator = () => {
      if (this.deleteAll) {
        throw new Error('You cannot set a WHERE clause in deleteAll');
      }
    };
  }
}
