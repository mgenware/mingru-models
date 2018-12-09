import { ActionType } from './action';
import { Table, SQL } from '../core/core';
import CoreUpdateAction from './coreUpdateAction';
import CoreSelectAction from './coreSelectAction';

export default class UpdateAction extends CoreUpdateAction {
  get whereSQL(): SQL | null {
    return this.coreSelectAction.whereSQL;
  }
  private coreSelectAction: CoreSelectAction;

  constructor(name: string, table: Table, public checkAffectedRows: boolean) {
    super(name, ActionType.update, table, 'Update');
    this.coreSelectAction = new CoreSelectAction(
      name,
      ActionType.select,
      table,
      'Update',
    );
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
