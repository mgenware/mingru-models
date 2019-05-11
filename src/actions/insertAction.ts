import { ActionType } from './ta';
import CoreUpdateAction from './coreUpdateAction';
import { SQLInputList } from '../core/sql';

export default class InsertAction extends CoreUpdateAction {
  constructor(public fetchInsertedID: boolean, public withDefaults: boolean) {
    super(ActionType.insert);
  }

  getInputs(): SQLInputList {
    return this.setterInputs;
  }
}
