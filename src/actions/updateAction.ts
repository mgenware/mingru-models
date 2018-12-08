import { ActionType } from './action';
import { Table, SQL } from '../core/core';
import { throwIfFalsy } from 'throw-if-arg-empty';
import CoreUpdateAction from './coreUpdateAction';

export default class UpdateAction extends CoreUpdateAction {
  whereSQL: SQL | null = null;

  constructor(name: string, table: Table, public checkAffectedRows: boolean) {
    super(name, ActionType.update, table, 'Update');
  }

  where(condition: SQL): UpdateAction {
    throwIfFalsy(condition, 'condition');

    if (this.whereSQL) {
      throw new Error('"where" is called twice');
    }
    this.whereSQL = condition;
    return this;
  }
}
