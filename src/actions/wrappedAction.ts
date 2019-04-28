import { Action, ActionType } from './ta';

export default class WrappedAction extends Action {
  constructor(public action: Action, public args: { [name: string]: string }) {
    super(ActionType.wrap);
  }
}
