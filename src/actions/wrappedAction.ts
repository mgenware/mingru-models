import { Action, ActionType } from './ta';
import { throwIfFalsy } from 'throw-if-arg-empty';

export const InsertedKey = '_inserted';
export const RowsAffectedKey = '_rows_affected';

export type WrappedActionValue = string | number;

export class WrappedAction extends Action {
  constructor(
    public action: Action,
    public args: { [name: string]: WrappedActionValue },
  ) {
    super(ActionType.wrap);
    throwIfFalsy(action, 'action');
    throwIfFalsy(args, 'args');

    if (Object.entries(args).length === 0) {
      throw new Error('"args" cannot be empty');
    }
  }
}
