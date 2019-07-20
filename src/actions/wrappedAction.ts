import { Action, ActionType } from './ta';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { CoreProperty } from '../core/core';

export class WrappedAction extends Action {
  constructor(
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

    CoreProperty.registerHandler(action, () => {
      this.__table = action.__table;
      this.__name = action.__name;
    });
  }
}
