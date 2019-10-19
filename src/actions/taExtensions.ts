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
  // Inherit table from current action (if exists)
  if (this.__table) {
    return new WrappedAction(this, this.__table, args);
  }

  // Now handling a tmp action wrapped, e.g. mm.select(...).wrap
  // If tmp action is also a wrapped action, modify it in place
  if (this instanceof WrappedAction) {
    this.args = {
      ...this.args,
      ...args,
    };
    return this;
  }

  // Leave __table as null. `mm.ta` will initialize this action, which
  // triggers the `validate` method, which then initializes the internal
  // action it wraps.
  return new WrappedAction(this, null, args);
};
