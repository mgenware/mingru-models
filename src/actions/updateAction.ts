import { throwIfFalsy } from 'throw-if-arg-empty';
import { ActionType } from './tableActions';
import { SQL } from '../core/sql';
import { CoreUpdateAction } from './coreUpdateAction';
import { where, byID, by, andBy } from './common';
import { Table, Column } from '../core/core';
import { sql } from '../core/sqlHelper';
import SQLConvertible from '../core/sqlConvertible';

export class UpdateAction extends CoreUpdateAction {
  whereSQLValue: SQL | null = null;
  whereValidator: ((value: SQL) => void) | null = null;

  constructor(public allowEmptyWhere: boolean, public ensureOneRowAffected: boolean) {
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

  onLoad(table: Table, rootTable: Table, name: string | null) {
    super.onLoad(table, rootTable, name);

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
