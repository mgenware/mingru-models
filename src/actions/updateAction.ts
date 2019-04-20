import { ActionType } from './ta';
import { SQL } from '../core/sql';
import CoreUpdateAction from './coreUpdateAction';
import { where, byIDUnsafe } from './common';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { CoreProperty } from '../core/core';

export default class UpdateAction extends CoreUpdateAction {
  whereSQL: SQL | null = null;
  whereValidator: ((value: SQL) => void) | null = null;

  constructor(public updateAll: boolean, public checkAffectedRows: boolean) {
    super(ActionType.update);
  }

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
