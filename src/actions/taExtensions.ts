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
  // For a tmp wrapped action, e.g. mm.select(...).wrap
  // If tmp action is also a wrapped action, we can modify it in place
  if (!this.__name && this instanceof WrappedAction) {
    this.args = {
      ...this.args,
      ...args,
    };
    return this;
  }

  // Like all other actions, `.wrap()` also respects `.from()`, that means
  // if __table is set, we'll pass down it.
  // NOTE: the `!this.__name` makes sure we only take care of a tmp action with
  // __table set (exactly what `.from` does)
  if (!this.__name && this.__table) {
    const res = new WrappedAction(this, args);
    res.__table = this.__table;
    return res;
  }

  // Eventually, `mm.ta` will initialize this action, which
  // triggers the `validate` method, which then initializes the internal
  // action it wraps.
  return new WrappedAction(this, args);
};
