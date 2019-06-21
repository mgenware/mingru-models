import { ActionType } from './ta';
import CoreUpdateAction from './coreUpdateAction';

export default class InsertAction extends CoreUpdateAction {
  constructor(
    public fetchInsertedID: boolean,
    public noColumnNumberCheck = false,
  ) {
    super(ActionType.insert);
  }

  validate() {
    super.validate();
    if (
      !this.noColumnNumberCheck &&
      !this.allSet && // allSet mean all columns are set to inputs/defaults, check passed
      this.setters.size !== this.__table.__columns.length
    ) {
      throw new Error(
        `You only set ${this.setters.size} of all ${
          this.__table.__columns.length
        } columns, you should set all columns or use 'unsafeInsert' to bypass this check`,
      );
    }
  }
}
