import { Action, ActionType } from './ta';
import { throwIfFalsy } from 'throw-if-arg-empty';

export default class TrransactAction extends Action {
  constructor(public actions: Action[]) {
    super(ActionType.transact);
    throwIfFalsy(actions, 'actions');
  }
}
