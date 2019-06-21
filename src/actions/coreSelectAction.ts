import { Action } from './ta';
import { SQL } from '../core/sql';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { where, byIDUnsafe } from './common';
import { CoreProperty } from '../core/core';

export class CoreSelectAction extends Action {
  whereSQL: SQL | null = null;
  whereValidator: ((value: SQL) => void) | null = null;

  where(value: SQL): this {
    throwIfFalsy(value, 'value');
    where(this, value);
    return this;
  }

  byID(): this {
    CoreProperty.registerHandler(this, () => {
      byIDUnsafe(this);
    });
    return this;
  }
}
