import { Action } from './ta';
import { SQL } from '../core/sql';
import { throwIfFalsy } from 'throw-if-arg-empty';

export default class CoreSelectAction extends Action {
  whereSQL: SQL | null = null;
  whereValidator: ((value: SQL) => void) | null = null;

  where(value: SQL): this {
    throwIfFalsy(value, 'value');
    if (this.whereValidator) {
      this.whereValidator(value);
    }

    if (this.whereSQL) {
      throw new Error('"where" is called twice');
    }
    this.whereSQL = value;
    return this;
  }

  byID(): this {
    const { table } = this;
    if (table.__pks.length > 1) {
      throw new Error(
        `byID cannot handle tables with more than 1 PKs, table name: "${
          table.__name
        }"`,
      );
    }
    if (table.__pks.length === 0) {
      throw new Error(
        `byID cannot handle tables with no PKs, table name: "${table.__name}"`,
      );
    }
    const pk = table.__pks[0];
    this.where(pk.isEqualToInput());
    return this;
  }
}
