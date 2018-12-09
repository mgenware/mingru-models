import { ActionType } from './action';
import { Table, SQL } from '../core/core';
import CoreSelectAction from './coreSelectAction';

export default class DeleteAction extends CoreSelectAction {
  whereSQL: SQL | null = null;

  constructor(name: string, table: Table, public checkAffectedRows: boolean) {
    super(name, ActionType.delete, table, 'Delete');
  }
}
