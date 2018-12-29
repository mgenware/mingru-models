import { ActionType } from './action';
import { Table, SQL } from '../core/core';
import CoreSelectAction from './coreSelectAction';

export default class DeleteAction extends CoreSelectAction {
  whereSQL: SQL | null = null;

  constructor(
    name: string,
    table: Table,
    public deleteAll: boolean,
    public checkAffectedRows: boolean,
  ) {
    super(name, ActionType.delete, table, 'Delete');
    this.whereValidator = () => {
      if (this.deleteAll) {
        throw new Error('You cannot set a WHERE clause in deleteAll');
      }
    };
  }
}
