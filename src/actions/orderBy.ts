import { throwIfFalsy } from 'throw-if-arg-empty';

export default class OrderBy {
  constructor(public columnName: string, public desc = false) {
    throwIfFalsy(columnName, 'columnName');
  }
}
