import { ActionType } from './ta';
import { SQL } from '../core/sql';
import CoreUpdateAction from './coreUpdateAction';
import { where, byIDUnsafe } from './common';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { CoreProperty } from '../core/core';

export default class UpdateAction extends CoreUpdateAction {
  whereSQL: SQL | null = null;
  whereValidator: ((value: SQL) => void) | null = null;

  constructor(public allowNoWhere: boolean, public checkAffectedRows: boolean) {
    super(ActionType.update);
  }

  where(value: SQL): this {
    throwIfFalsy(value, 'value');
    where(this, value);
    return this;
  }

  byID(): this {
    CoreProperty.registerHandler(this, () => {
      byIDUnsafe(this);
    });
    return this;
  }

  validate() {
    super.validate();

    if (!this.allowNoWhere && !this.whereSQL) {
      throw new Error(
        `'allowNoWhere' is set to false, you must define an WHERE clause. Otherwise, use 'unsafeUpdateAll'`,
      );
    }

    // super.inputs is set after super.validate(), now we need to merge WHERE inputs into it
    if (this.whereSQL) {
      const inputs = this.whereSQL.inputs.copy();
      inputs.merge(this.inputs);
      inputs.seal();
      this.inputs = inputs;
    }
  }
}
