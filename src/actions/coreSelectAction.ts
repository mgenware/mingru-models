import { Action } from './tableActions';
import { SQL } from '../core/sql';
import { where, byID, by, andBy } from './common';
import { Column } from '../core/core';
import SQLConvertible from '../core/sqlConvertible';
import { sql } from '../core/sqlHelper';

export class CoreSelectAction extends Action {
  whereSQLValue: SQL | null = null;
  whereValidator: ((value: SQL) => void) | null = null;

  whereSQL(value: SQL): this {
    where(this, value);
    return this;
  }

  where(literals: TemplateStringsArray, ...params: SQLConvertible[]): this {
    this.whereSQL(sql(literals, ...params));
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
    return this.whereSQLValue ? this.whereSQLValue.toString() : '';
  }
}
