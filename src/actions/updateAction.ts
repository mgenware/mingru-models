import { ActionType } from './ta';
import { SQL } from '../core/sql';
import { CoreUpdateAction } from './coreUpdateAction';
import { where, byIDUnsafe } from './common';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { CoreProperty, Table } from '../core/core';

export class UpdateAction extends CoreUpdateAction {
  whereSQL: SQL | null = null;
  whereValidator: ((value: SQL) => void) | null = null;

  constructor(
    public allowNoWhere: boolean,
    public ensureOneRowAffected: boolean,
  ) {
    super(ActionType.update);
  }

  where(value: SQL): this {
    throwIfFalsy(value, 'value');
    where(this, value);
    return this;
  }

  byID(inputName?: string): this {
    CoreProperty.registerHandler(this, () => {
      byIDUnsafe(this, inputName);
    });
    return this;
  }

  validate(table: Table, name: string) {
    super.validate(table, name);

    if (!this.allowNoWhere && !this.whereSQL) {
      throw new Error(
        `'allowNoWhere' is set to false, you must define an WHERE clause. Otherwise, use 'unsafeUpdateAll'`,
      );
    }
  }
}
