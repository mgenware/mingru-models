import { Action, ActionType } from './ta';
import { throwIfFalsy } from 'throw-if-arg-empty';

export default class TransactAction extends Action {
  constructor(public actions: Action[], public resultIndex?: number) {
    super(ActionType.transact);
    throwIfFalsy(actions, 'actions');

    if (resultIndex && (resultIndex < 0 || resultIndex >= actions.length)) {
      throw new Error(`resultIndex(${resultIndex}) is out of bounds`);
    }

    // CoreProperty.registerHandler(this, () => {
    //   const len = actions.length;
    //   // When all actions are initialized, calculate the inputs property
    //   let counter = 0;
    //   for (const action of actions) {
    //     CoreProperty.registerHandler(action, () => {
    //       counter++;
    //       if (counter === len) {
    //         const inputs = new SQLVariableList();
    //         for (const a of actions) {
    //           const actionInputs = a.getInputs();
    //           if (!actionInputs) {
    //             throw new Error(
    //               `Unexpected empty inputs from action "${a.__name}"`,
    //             );
    //           }
    //           inputs.merge(actionInputs);
    //         }
    //         inputs.seal();
    //         this.inputs = inputs;
    //       }
    //     });
    //   }
    // });
  }
}
