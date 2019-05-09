import { Action, ActionType } from './ta';

export default class TrransactAction extends Action {
  constructor(public actions: Action[]) {
    super(ActionType.transact);
  }
}
