import { throwIfFalsy } from 'throw-if-arg-empty';
import { Column, ColumnType } from '../core/core';
import { SQL } from '../core/sql';
import { ColumnAttribute } from '../attrs';

export class RawColumn {
  readonly core: Column | SQL;
  readonly selectedName: string | null;
  readonly type: ColumnType | null;

  #attrs = new Map<ColumnAttribute, unknown>();
  get __attrs(): ReadonlyMap<ColumnAttribute, unknown> {
    return this.#attrs;
  }

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

  attr(name: ColumnAttribute, value: unknown): this {
    this.#attrs.set(name, value);
    return this;
  }

  privateAttr(): this {
    return this.attr(ColumnAttribute.isPrivate, true);
  }

  toString(): string {
    return `RawColumn(${this.selectedName}, core = ${this.core.toString()})`;
  }
}
