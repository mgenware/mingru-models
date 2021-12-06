import { throwIfFalsy } from 'throw-if-arg-empty';
import { Column, SelectedColumn } from '../core/core.js';
import { ColumnAttribute } from '../attrs.js';

declare module '../core/core.js' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Column {
    as(name: string): SelectedColumn;
    attr(name: ColumnAttribute, value: unknown): SelectedColumn;
    privateAttr(): SelectedColumn;
  }
}

Column.prototype.as = function (name: string): SelectedColumn {
  throwIfFalsy(name, 'name');
  return new SelectedColumn(this, name);
};

Column.prototype.attr = function (name: ColumnAttribute, value: unknown): SelectedColumn {
  return new SelectedColumn(this).attr(name, value);
};

Column.prototype.privateAttr = function (): SelectedColumn {
  return this.attr(ColumnAttribute.isPrivate, true);
};
