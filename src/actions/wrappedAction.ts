import { Action, ActionType } from './ta';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { SQLVariableList } from '../core/sql';
import { CoreProperty } from '../core/core';

export const InsertedKey = '_inserted';
export const RowsAffectedKey = '_rows_affected';

export type WrappedActionValue = string | number;

export class WrappedAction extends Action {
  inputs!: SQLVariableList;

  constructor(
    public action: Action,
    public args: { [name: string]: WrappedActionValue },
  ) {
    super(ActionType.wrap);
    throwIfFalsy(action, 'action');
    throwIfFalsy(args, 'args');

    if (Object.entries(args).length === 0) {
      throw new Error('"args" cannot be empty');
    }

    CoreProperty.registerHandler(action, () => {
      // Throw on non-existing argument names
      const inputs = action.getInputs();
      for (const key of Object.keys(args)) {
        if (!inputs.getByName(key)) {
          throw new Error(
            `The argument "${key}" doesn't exist in action "${action.__name}"`,
          );
        }
      }
      // Populate new inputs
      const newInputs = new SQLVariableList();
      for (const input of inputs.list) {
        if (!args[input.name]) {
          newInputs.add(input);
        }
      }
      this.inputs = newInputs;
    });
  }

  getInputs(): SQLVariableList {
    return this.inputs;
  }
}
