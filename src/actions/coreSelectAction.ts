import { Action } from './ta';
import { SQL, sql } from '../core/sql';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { where, byIDUnsafe } from './common';
import { CoreProperty, Column } from '../core/core';

export class CoreSelectAction extends Action {
  whereSQL: SQL | null = null;
  whereValidator: ((value: SQL) => void) | null = null;

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

  by(column: Column): this {
    throwIfFalsy(column, 'column');
    this.where(sql`${column.toInput()}`);
    return this;
  }
}
