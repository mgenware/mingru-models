import { ActionType } from './tableActions';
import { CoreUpdateAction } from './coreUpdateAction';
import { Table } from '../core/core';

export class InsertAction extends CoreUpdateAction {
  constructor(public ensureOneRowAffected: boolean, public allowUnsetColumns = false) {
    super(ActionType.insert);
  }

  validate(table: Table, name: string) {
    super.validate(table, name);

    const setterCount = this.setters.size;
    // Number of columns = total count - number of auto_increment PKs
    const colCount = Object.entries(table.__columns).length - table.__pkAIs.length;
    if (
      !this.allowUnsetColumns &&
      // if no wild flags are set
      !this.autoSetters.size &&
      // setterCount can > colCount as you may set all columns but colCount = all - AI columns
      setterCount < colCount
    ) {
      throw new Error(
        `You only set ${setterCount} of all ${colCount} columns (not including AUTO_INCREMENT columns), you should set all columns or use \`unsafeInsert\` to bypass this check`,
      );
    }
  }
}
