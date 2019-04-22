import { Column } from '../core/core';
import { RawColumn } from './selectAction';
import { throwIfFalsy } from 'throw-if-arg-empty';

declare module '../core/core' {
  interface Column {
    as(name: string): RawColumn;
  }
}

Column.prototype.as = function(name: string) {
  throwIfFalsy(name, 'name');
  return new RawColumn(this, name);
};
