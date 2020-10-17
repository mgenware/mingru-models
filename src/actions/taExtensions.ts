import { Action } from './tableActions';
import { WrapAction, ValueRef, WrapActionArgValue } from './wrapAction';
import { TransactionMember } from './transactAction';
import { ReturnValues } from '../returnValues';

declare module './tableActions' {
  interface Action {
    wrap(args: { [name: string]: WrapActionArgValue }): WrapAction;
    wrapAsRefs(args: { [name: string]: string }): WrapAction;
    declareReturnValues(values: { [name: string]: string }): TransactionMember;
    declareReturnValue(name: string, value: string): TransactionMember;
    declareInsertedID(value: string): TransactionMember;
  }
}

Action.prototype.wrap = function (args: { [name: string]: WrapActionArgValue }): WrapAction {
  // If this is an inline action, i.e. `mm.select(...).wrap`.
  // And if this is also a WRAP action, we can merge those two actions together.
  // e.g. `mm.select().wrap().wrap().wrap()`.
  if (!this.__name) {
    if (this instanceof WrapAction) {
      this.args = {
        ...this.args,
        ...args,
      };
      return this;
    }
  }
  return new WrapAction(this, args);
};

Action.prototype.declareReturnValues = function (values: {
  [name: string]: string;
}): TransactionMember {
  return new TransactionMember(this, undefined, values);
};

Action.prototype.declareReturnValue = function (name: string, value: string): TransactionMember {
  return this.declareReturnValues({ [name]: value });
};

Action.prototype.declareInsertedID = function (value: string): TransactionMember {
  return this.declareReturnValues({ [ReturnValues.insertedID]: value });
};

Action.prototype.wrapAsRefs = function (args: { [name: string]: string }): WrapAction {
  const converted: { [name: string]: ValueRef } = {};
  for (const [k, v] of Object.entries(args)) {
    converted[k] = new ValueRef(v);
  }
  return this.wrap(converted);
};
