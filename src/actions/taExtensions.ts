import { Action } from './tableActions';
import { WrappedAction, ValueRef, WrapActionArgValue } from './wrappedAction';
import { TransactionMember } from './transactAction';
import { ReturnValues } from '../returnValues';

declare module './tableActions' {
  interface Action {
    wrap(args: { [name: string]: WrapActionArgValue }): WrappedAction;
    wrapAsRefs(args: { [name: string]: string }): WrappedAction;
    declareReturnValues(values: { [name: string]: string }): TransactionMember;
    declareReturnValue(name: string, value: string): TransactionMember;
    declareInsertedID(value: string): TransactionMember;
  }
}

Action.prototype.wrap = function (args: {
  [name: string]: WrapActionArgValue;
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

Action.prototype.declareReturnValues = function (values: {
  [name: string]: string;
}): TransactionMember {
  return new TransactionMember(this, undefined, values);
};

Action.prototype.declareReturnValue = function (
  name: string,
  value: string,
): TransactionMember {
  return this.declareReturnValues({ [name]: value });
};

Action.prototype.declareInsertedID = function (
  value: string,
): TransactionMember {
  return this.declareReturnValues({ [ReturnValues.insertedID]: value });
};

Action.prototype.wrapAsRefs = function (args: {
  [name: string]: string;
}): WrappedAction {
  const converted: { [name: string]: ValueRef } = {};
  for (const [k, v] of Object.entries(args)) {
    converted[k] = new ValueRef(v);
  }
  return this.wrap(converted);
};
