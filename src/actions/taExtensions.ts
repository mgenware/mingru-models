import { Action } from './actionGroup.js';
import { WrapAction, CapturedVar, WrapArgValue } from './wrapAction.js';
import { TransactionMember } from './transactAction.js';
import { ReturnValues } from '../returnValues.js';

declare module './actionGroup.js' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Action {
    wrap(args: { [name: string]: WrapArgValue }): WrapAction;
    wrapAsRefs(args: { [name: string]: string }): WrapAction;
    declareReturnValues(values: { [name: string]: string }): TransactionMember;
    declareReturnValue(name: string, value: string): TransactionMember;
    declareInsertedID(value: string): TransactionMember;
  }
}

Action.prototype.wrap = function (args: { [name: string]: WrapArgValue }): WrapAction {
  // If this is an inline action, i.e. `mm.selectRow(...).wrap`.
  // And if this is also a WRAP action, we can merge those two actions together.
  // e.g. `mm.selectRow().wrap().wrap().wrap()`.
  if (!this.__getData().name) {
    if (this instanceof WrapAction) {
      this.__setArgs({
        ...this.__getData().args,
        ...args,
      });
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
  const converted: { [name: string]: CapturedVar } = {};
  for (const [k, v] of Object.entries(args)) {
    converted[k] = new CapturedVar(v);
  }
  return this.wrap(converted);
};
