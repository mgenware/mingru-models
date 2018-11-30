import { throwIfFalsy } from 'throw-if-arg-empty';
import utils from '../lib/utils';
import { Table } from '../core/core';

export class Action {
  name: string;

  constructor(
    name: string,
    public table: Table,
    public prefix: string,
  ) {
    throwIfFalsy(name, 'name');
    throwIfFalsy(table, 'table');
    this.name = this.prefix + utils.capitalizeFirstLetter(name);
  }
}
