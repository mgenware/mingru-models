import { ActionType } from './ta';
import CoreUpdateAction from './coreUpdateAction';

export default class InsertAction extends CoreUpdateAction {
  constructor(public fetchInsertedID: boolean) {
    super(ActionType.insert);
  }
}
