import { Column } from '../core/core';
import { RawColumn } from './selectAction';
import { throwIfFalsy } from 'throw-if-arg-empty';

declare module '../core/core' {
  interface Column {
    as(name: string): RawColumn;
    attrs(values: { [name: string]: unknown }): RawColumn;
  }
}

Column.prototype.as = function(name: string): RawColumn {
  throwIfFalsy(name, 'name');
  return new RawColumn(this, name);
};

Column.prototype.attrs = function(values: {
  [name: string]: unknown;
}): RawColumn {
  return new RawColumn(this).attrs(values);
};
