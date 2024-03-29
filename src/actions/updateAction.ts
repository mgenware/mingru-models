import { ActionType } from './actionGroup.js';
import { CoreUpdateAction, CoreUpdateActionData } from './coreUpdateAction.js';
import { where, by, andBy } from './common.js';
import { Column, Table, SQL } from '../core/core.js';
import { sql } from '../core/sqlHelper.js';
import SQLConvertible from '../core/sqlConvertible.js';
import { CoreSelectionActionData } from './coreSelectAction.js';

export interface UpdateActionData extends CoreUpdateActionData, CoreSelectionActionData {
  unsafeMode?: boolean;
  ensureOneRowAffected?: boolean;
}

export class UpdateAction extends CoreUpdateAction {
  #data = this.__data as UpdateActionData;
  override __getData(): UpdateActionData {
    return this.#data;
  }

  constructor(unsafeMode: boolean, ensureOneRowAffected: boolean) {
    super(ActionType.update);

    this.#data.unsafeMode = unsafeMode;
    this.#data.ensureOneRowAffected = ensureOneRowAffected;
  }

  whereSQL(value: SQL): this {
    where(this.#data, value);
    return this;
  }

  where(literals: TemplateStringsArray, ...params: SQLConvertible[]): this {
    this.whereSQL(sql(literals, ...params));
    return this;
  }

  by(column: Column, name?: string): this {
    by(this.#data, column, name);
    return this;
  }

  andBy(column: Column, name?: string): this {
    andBy(this.#data, column, name);
    return this;
  }

  addAssign(column: Column, value: SQLConvertible): this {
    return this.set(column, sql`${column} + ${value}`);
  }

  subAssign(column: Column, value: SQLConvertible): this {
    return this.set(column, sql`${column} - ${value}`);
  }

  override __validate(table: Table) {
    super.__validate(table);

    if (!this.#data.unsafeMode && !this.#data.whereSQLValue) {
      throw new Error(
        '`unsafeMode` is not on, you must define a WHERE clause. Otherwise, use `unsafeUpdateAll`',
      );
    }
  }

  get __whereSQLString(): string {
    return this.#data.whereSQLValue?.toString() ?? '';
  }
}
