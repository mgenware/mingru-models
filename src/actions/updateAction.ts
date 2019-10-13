import { ActionType } from './ta';
import { SQL } from '../core/sql';
import { CoreUpdateAction } from './coreUpdateAction';
import { where, byID, by, andBy } from './common';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { Table, Column } from '../core/core';

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
    byID(this, inputName);
    return this;
  }

  by(column: Column): this {
    by(this, column);
    return this;
  }

  andBy(column: Column): this {
    andBy(this, column);
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

  get whereSQLString(): string {
    return this.whereSQL ? this.whereSQL.toString() : '';
  }
}
