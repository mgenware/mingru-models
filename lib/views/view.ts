import { throwIfFalsy } from 'throw-if-arg-empty';

export class View {
  constructor(
    public name: string,
  ) {
    throwIfFalsy(name, 'name');
  }
}
