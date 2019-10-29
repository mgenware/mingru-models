import { Column } from '../core/core';
import { RawColumn } from './selectAction';
import { throwIfFalsy } from 'throw-if-arg-empty';

declare module '../core/core' {
  interface Column {
    as(name: string): RawColumn;
    attr(name: string, value?: unknown): RawColumn;
  }
}

Column.prototype.as = function(name: string): RawColumn {
  throwIfFalsy(name, 'name');
  return new RawColumn(this, name);
};

Column.prototype.attr = function(
  name: string,
  value: unknown = true,
): RawColumn {
  return new RawColumn(this).attr(name, value);
};
