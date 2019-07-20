import { Action, ActionType } from './ta';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { Table } from '../core/core';

export class WrappedAction extends Action {
  constructor(
    srcTable: Table,
    public action: Action,
    // tslint:disable-next-line no-any
    public args: { [name: string]: any },
  ) {
    super(ActionType.wrap);
    throwIfFalsy(action, 'action');
    throwIfFalsy(args, 'args');

    if (Object.entries(args).length === 0) {
      throw new Error('"args" cannot be empty');
    }

    this.__table = srcTable;
  }
}
