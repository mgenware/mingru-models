import { ActionType } from './action';
import { Table } from '../core/core';
import CoreUpdateAction from './coreUpdateAction';

export default class InsertAction extends CoreUpdateAction {
  constructor(
    name: string,
    table: Table,
    public fetchInsertedID: boolean,
    public withDefaults: boolean,
  ) {
    super(name, ActionType.insert, table, 'Insert');
  }
}
