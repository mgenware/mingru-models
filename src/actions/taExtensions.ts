import { Action } from './ta';
import { WrappedAction } from './wrappedAction';

declare module './ta' {
  interface Action {
    wrap(args: { [name: string]: string }): WrappedAction;
  }
}

Action.prototype.wrap = function(args: {
  // tslint:disable-next-line no-any
  [name: string]: any;
}): WrappedAction {
  return new WrappedAction(this, args);
};
