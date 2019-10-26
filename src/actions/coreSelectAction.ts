import { Action } from './tableActions';
import { SQL } from '../core/sql';
import { where, byID, by, andBy } from './common';
import { Column } from '../core/core';

export class CoreSelectAction extends Action {
  whereSQL: SQL | null = null;
  whereValidator: ((value: SQL) => void) | null = null;

  where(value: SQL): this {
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

  // Mostly for testing and debugging purposes.
  get whereSQLString(): string {
    return this.whereSQL ? this.whereSQL.toString() : '';
  }
}
