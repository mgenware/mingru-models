import { Action, ActionType } from './ta';
import { throwIfFalsy } from 'throw-if-arg-empty';

export const InsertedKey = '_inserted';
export const RowsAffectedKey = '_rows_affected';

export class WrappedActionReturnValue {
  constructor(public index: number, public key: string) {}
}

export type WrappedActionValue = string | WrappedActionReturnValue;

export default class WrappedAction extends Action {
  constructor(
    public action: Action,
    public args: { [name: string]: WrappedActionValue },
  ) {
    super(ActionType.wrap);
    throwIfFalsy(action, 'action');
    throwIfFalsy(args, 'args');
  }
}
