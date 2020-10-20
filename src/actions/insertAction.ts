import { ActionType } from './tableActions';
import { CoreUpdateAction } from './coreUpdateAction';
import { Table } from '../core/core';

export class InsertAction extends CoreUpdateAction {
  constructor(
    public readonly ensureOneRowAffected: boolean,
    public readonly allowUnsetColumns = false,
  ) {
    super(ActionType.insert);
  }

  validate(groupTable: Table) {
    super.validate(groupTable);

    const setterCount = this.setters.size;
    const table = this.mustGetAvailableSQLTable(groupTable);
    // Number of columns = total count - number of auto_increment PKs.
    const colCount = Object.entries(table.__columns).length - table.__aiPKs.length;
    if (
      !this.allowUnsetColumns &&
      // If no wild flags are set.
      !this.autoSetters.size &&
      setterCount < colCount
    ) {
      throw new Error(
        `You only set ${setterCount} of all ${colCount} columns (not including AUTO_INCREMENT columns), you should set all columns or use \`unsafeInsert\` to bypass this check`,
      );
    }
  }
}
