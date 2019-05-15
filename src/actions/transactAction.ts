import { Action, ActionType } from './ta';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { SQLInputList } from '../core/sql';
import { CoreProperty } from '../core/core';

export default class TrransactAction extends Action {
  inputs!: SQLInputList;

  constructor(public actions: Action[]) {
    super(ActionType.transact);
    throwIfFalsy(actions, 'actions');

    CoreProperty.registerHandler(this, () => {
      const len = actions.length;
      // When all actions are initialized, calculate the inputs property
      let counter = 0;
      for (const action of actions) {
        CoreProperty.registerHandler(action, () => {
          counter++;
          if (counter === len) {
            const inputs = new SQLInputList();
            for (const a of actions) {
              const actionInputs = a.getInputs();
              if (!actionInputs) {
                throw new Error(
                  `Unexpected empty inputs from action "${a.__name}"`,
                );
              }
              inputs.merge(actionInputs);
            }
            inputs.seal();
            this.inputs = inputs;
          }
        });
      }
    });
  }

  getInputs(): SQLInputList {
    return this.inputs;
  }
}
