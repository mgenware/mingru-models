import { Action, ActionData } from './actionGroup.js';
import { where, by, andBy } from './common.js';
import { Column, SQL } from '../core/core.js';
import SQLConvertible from '../core/sqlConvertible.js';
import { sql } from '../core/sqlHelper.js';

export interface CoreSelectionActionData extends ActionData {
  whereSQLValue?: SQL;
}

export class CoreSelectAction extends Action {
  #data = this.__data as CoreSelectionActionData;
  override __getData(): CoreSelectionActionData {
    return this.#data;
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

  // Mostly for testing and debugging purposes.
  get __whereSQLString(): string {
    return this.#data.whereSQLValue?.toString() ?? '';
  }
}
