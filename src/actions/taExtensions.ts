import { Action } from './ta';
import { WrappedAction } from './wrappedAction';

declare module './ta' {
  interface Action {
    wrap(args: { [name: string]: unknown }): WrappedAction;
  }
}

Action.prototype.wrap = function(args: {
  [name: string]: unknown;
}): WrappedAction {
  if (this.__table || this instanceof WrappedAction === false) {
    return new WrappedAction(this, args);
  }
  // if this is a wrapped action && __table is not set, it means this action is not finalized and we can modify it in place
  const action = this as WrappedAction;
  action.args = {
    ...action.args,
    ...args,
  };
  return action;
};
