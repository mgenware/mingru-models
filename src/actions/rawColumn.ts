import { throwIfFalsy } from 'throw-if-arg-empty';
import { Column, ColumnType } from '../core/core';
import { SQL } from '../core/sql';
import { ColumnAttribute } from '../attrs';

export interface RawColumnData {
  core?: Column | SQL;
  selectedName?: string;
  type?: ColumnType;
  attrs?: Map<ColumnAttribute, unknown>;
}

export class RawColumn {
  protected __data: RawColumnData = {};
  __getData(): RawColumnData {
    return this.__data;
  }

  private get data(): RawColumnData {
    return this.__data;
  }

  private mustGetAttrs(): Map<ColumnAttribute, unknown> {
    return (this.data.attrs ??= new Map<ColumnAttribute, unknown>());
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

    this.data.selectedName = selectedName;
    this.data.type = type;
    if (core instanceof Column) {
      this.data.core = core;
    } else {
      this.data.core = core;
      if (!selectedName) {
        throw new Error(
          'The argument `selectedName` is required for a `RawColumn` with SQL expression',
        );
      }
    }
  }

  attr(name: ColumnAttribute, value: unknown): this {
    this.mustGetAttrs().set(name, value);
    return this;
  }

  privateAttr(): this {
    return this.attr(ColumnAttribute.isPrivate, true);
  }

  toString(): string {
    return `RawColumn(${this.data.selectedName}, core = ${this.data.core})`;
  }
}
