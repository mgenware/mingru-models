import { Action } from './ta';
import { WrappedAction } from './wrappedAction';

declare module './ta' {
  interface Action {
    wrap(args: { [name: string]: string }): WrappedAction;
  }
}

Action.prototype.wrap = function(args: {
  [name: string]: string;
}): WrappedAction {
  return new WrappedAction(this, args);
};
