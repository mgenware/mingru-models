import { ActionType } from './ta';
import { CoreUpdateAction } from './coreUpdateAction';

export class InsertAction extends CoreUpdateAction {
  constructor(
    public ensureOneRowAffected: boolean,
    public noColumnNumberCheck = false,
  ) {
    super(ActionType.insert);
  }

  validate() {
    super.validate();

    const setterCount = this.setters.size;
    // Number of columns = total count - number of auto_increment PKs
    const cols = this.__table.__columns.length - this.__table.__pkAIs.length;
    if (
      !this.noColumnNumberCheck &&
      !this.autoSetter && // allSet mean all columns are set to inputs/defaults, check passed
      setterCount !== cols
    ) {
      throw new Error(
        `You only set ${this.setters.size} of all ${
          this.__table.__columns.length
        } columns (not including AUTO_INCREMENT columns), you should set all columns or use 'unsafeInsert' to bypass this check`,
      );
    }
  }
}
