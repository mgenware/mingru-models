import { Column } from '../core/core';
import { CalculatedColumn } from './selectAction';
import { throwIfFalsy } from 'throw-if-arg-empty';

declare module '../core/core' {
  interface Column {
    as(name: string): CalculatedColumn;
  }
}

Column.prototype.as = function(name: string) {
  throwIfFalsy(name, 'name');
  return new CalculatedColumn(this, name);
};
