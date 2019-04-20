import { ActionType } from './ta';
import { SQL } from '../core/sql';
import CoreUpdateAction from './coreUpdateAction';
import CoreSelectAction from './coreSelectAction';

export default class UpdateAction extends CoreUpdateAction {
  get whereSQL(): SQL | null {
    return this.coreSelectAction.whereSQL;
  }
  private coreSelectAction: CoreSelectAction;

  constructor(public updateAll: boolean, public checkAffectedRows: boolean) {
    super(ActionType.update);
    this.coreSelectAction = new CoreSelectAction(ActionType.select);
    this.coreSelectAction.whereValidator = () => {
      if (this.updateAll) {
        throw new Error('You cannot set a WHERE clause in updateAll');
      }
    };
  }

  where(value: SQL): this {
    this.coreSelectAction.where(value);
    return this;
  }

  byID(): this {
    this.coreSelectAction.byID();
    return this;
  }
}
