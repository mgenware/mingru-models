import { Column, SelectedColumn } from '../core/core.js';
import { SelectedColumnAttribute } from '../attrs.js';

declare module '../core/core.js' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Column {
    as(name: string): SelectedColumn;
    attr(name: SelectedColumnAttribute, value: unknown): SelectedColumn;
    privateAttr(): SelectedColumn;
  }
}

Column.prototype.as = function (name: string): SelectedColumn {
  return new SelectedColumn(this, name);
};

Column.prototype.attr = function (name: SelectedColumnAttribute, value: unknown): SelectedColumn {
  return new SelectedColumn(this).attr(name, value);
};

Column.prototype.privateAttr = function (): SelectedColumn {
  return this.attr(SelectedColumnAttribute.isPrivate, true);
};
