import { throwIfFalsy } from 'throw-if-arg-empty';
import { Column } from '../core/core';
import { ColumnAttribute } from '../attrs';
import { RawColumn } from './rawColumn';

declare module '../core/core' {
  interface Column {
    as(name: string): RawColumn;
    attr(name: ColumnAttribute, value: unknown): RawColumn;
    privateAttr(): RawColumn;
  }
}

Column.prototype.as = function (name: string): RawColumn {
  throwIfFalsy(name, 'name');
  return new RawColumn(this, name);
};

Column.prototype.attr = function (name: ColumnAttribute, value: unknown): RawColumn {
  return new RawColumn(this).attr(name, value);
};

Column.prototype.privateAttr = function (): RawColumn {
  return this.attr(ColumnAttribute.isPrivate, true);
};
