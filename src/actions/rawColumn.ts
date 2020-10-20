import { throwIfFalsy } from 'throw-if-arg-empty';
import { Column, ColumnType } from '../core/core';
import { SQL } from '../core/sql';
import { ColumnAttributes } from '../attrs';

export class RawColumn {
  readonly core: Column | SQL;
  readonly selectedName: string | null;
  readonly type: ColumnType | null;

  __attrs: { [name: string]: unknown } = {};

  get __type(): ColumnType | null {
    return this.type;
  }

  constructor(
    core: Column | SQL,
    // `selectedName` can be undefined if `core` is a column.
    // In that case, when you call `toInput`, a name will be generated from all its joined columns,
    // so that you don't need to specify names when using joins.
    selectedName?: string,
    type?: ColumnType,
  ) {
    throwIfFalsy(core, 'core');
    this.selectedName = selectedName || null;
    this.type = type || null;
    if (core instanceof Column) {
      this.core = core;
    } else {
      this.core = core;
      if (!selectedName) {
        throw new Error(
          'The argument `selectedName` is required for a `RawColumn` with SQL expression',
        );
      }
    }
  }

  attrs(values: { [name: string]: unknown }): this {
    this.__attrs = { ...this.__attrs, ...values };
    return this;
  }

  attr(name: string, value: unknown): this {
    this.attrs({ [name]: value });
    return this;
  }

  privateAttr(): this {
    return this.attr(ColumnAttributes.isPrivate, true);
  }

  toString(): string {
    return `RawColumn(${this.selectedName}, core = ${this.core.toString()})`;
  }
}
