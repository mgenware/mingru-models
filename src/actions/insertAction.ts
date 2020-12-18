import { ActionType } from './tableActions';
import { CoreUpdateAction, CoreUpdateActionData } from './coreUpdateAction';
import { Table } from '../core/core';

export interface InsertActionData extends CoreUpdateActionData {
  ensureOneRowAffected?: boolean;
  allowUnsetColumns?: boolean;
}

export class InsertAction extends CoreUpdateAction {
  private get data(): InsertActionData {
    return this.__data;
  }

  constructor(ensureOneRowAffected: boolean, allowUnsetColumns = false) {
    super(ActionType.insert);

    this.data.ensureOneRowAffected = ensureOneRowAffected;
    this.data.allowUnsetColumns = allowUnsetColumns;
  }

  validate(groupTable: Table) {
    super.validate(groupTable);

    const setterCount = this.data.setters?.size ?? 0;
    const table = this.mustGetAvailableSQLTable(groupTable);
    // Number of columns = total count - number of auto_increment PKs.
    const colCount = Object.entries(table.__columns).length - table.__aiPKs.length;
    if (
      !this.data.allowUnsetColumns &&
      // If no wild flags are set.
      !this.data.autoSetters?.size &&
      setterCount < colCount
    ) {
      throw new Error(
        `You only set ${setterCount} of all ${colCount} columns (not including AUTO_INCREMENT columns), you should set all columns or use \`unsafeInsert\` to bypass this check`,
      );
    }
  }
}
