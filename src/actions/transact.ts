import { Action, ActionType } from './ta';
import { throwIfFalsy } from 'throw-if-arg-empty';

export class TransactAction extends Action {
  constructor(public actions: Action[], public result: Action | null) {
    super(ActionType.transact);
    throwIfFalsy(actions, 'actions');
  }
}

export function transact(actions: Action[], result?: Action): TransactAction {
  return new TransactAction(actions, result || null);
}
