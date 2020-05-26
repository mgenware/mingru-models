import { throwIfFalsy } from 'throw-if-arg-empty';
import { Column } from '../core/core';
import { ColumnAttributes } from '../attrs';
import { RawColumn } from './rawColumn';

declare module '../core/core' {
  interface Column {
    as(name: string): RawColumn;
    attrs(values: { [name: string]: unknown }): RawColumn;
    attr(name: string, value: unknown): RawColumn;
    privateAttr(): RawColumn;
  }
}

Column.prototype.as = function (name: string): RawColumn {
  throwIfFalsy(name, 'name');
  return new RawColumn(this, name);
};

Column.prototype.attrs = function (values: {
  [name: string]: unknown;
}): RawColumn {
  return new RawColumn(this).attrs(values);
};

Column.prototype.attr = function (name: string, value: unknown): RawColumn {
  return this.attrs({ [name]: value });
};

Column.prototype.privateAttr = function (): RawColumn {
  return this.attr(ColumnAttributes.isPrivate, true);
};
