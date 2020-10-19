import { throwIfFalsy } from 'throw-if-arg-empty';
import { ActionType } from './tableActions';
import { SQL } from '../core/sql';
import { CoreUpdateAction } from './coreUpdateAction';
import { where, by, andBy } from './common';
import { Column, Table } from '../core/core';
import { sql } from '../core/sqlHelper';
import SQLConvertible from '../core/sqlConvertible';

export class UpdateAction extends CoreUpdateAction {
  #whereSQLValue: SQL | null = null;
  get whereSQLValue(): SQL | null {
    return this.#whereSQLValue;
  }

  #whereValidator: ((value: SQL) => void) | null = null;
  get whereValidator(): ((value: SQL) => void) | null {
    return this.#whereValidator;
  }

  constructor(
    public readonly allowEmptyWhere: boolean,
    public readonly ensureOneRowAffected: boolean,
  ) {
    super(ActionType.update);
  }

  whereSQL(value: SQL): this {
    throwIfFalsy(value, 'value');
    where(this, value);
    return this;
  }

  where(literals: TemplateStringsArray, ...params: SQLConvertible[]): this {
    this.whereSQL(sql(literals, ...params));
    return this;
  }

  by(column: Column, name?: string): this {
    by(this, column, name);
    return this;
  }

  andBy(column: Column, name?: string): this {
    andBy(this, column, name);
    return this;
  }

  validate(groupTable: Table) {
    super.validate(groupTable);

    if (!this.allowEmptyWhere && !this.whereSQLValue) {
      throw new Error(
        '`allowNoWhere` is set to false, you must define a WHERE clause. Otherwise, use `unsafeUpdateAll`',
      );
    }
  }

  get whereSQLString(): string {
    return this.whereSQLValue ? this.whereSQLValue.toString() : '';
  }
}
