import { throwIfFalsy } from 'throw-if-arg-empty';

export class Action {
  constructor(
    public name: string,
  ) {
    throwIfFalsy(name, 'name');
  }
}
