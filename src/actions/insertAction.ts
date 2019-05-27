import { ActionType } from './ta';
import CoreUpdateAction from './coreUpdateAction';
import { SQLVariableList } from '../core/sql';

export default class InsertAction extends CoreUpdateAction {
  constructor(public fetchInsertedID: boolean, public withDefaults: boolean) {
    super(ActionType.insert);
  }

  getInputs(): SQLVariableList {
    return this.setterInputs;
  }
}
