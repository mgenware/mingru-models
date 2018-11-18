import { throwIfFalsy } from 'throw-if-arg-empty';
import { capitalizeFirstLetter } from '../lib/stringUtil';

export class Action {
  name: string;

  constructor(
    name: string,
  ) {
    throwIfFalsy(name, 'name');
    this.name = this.prefix() + capitalizeFirstLetter(name);
  }

  prefix(): string {
    throw new Error(`Not implemented yet`);
  }
}
