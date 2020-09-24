import { throwIfFalsy } from 'throw-if-arg-empty';
import { Column, ColumnType } from '../core/core';
import { SQL, SQLVariable } from '../core/sql';
import { ColumnAttributes } from '../attrs';

export class RawColumn {
  core: Column | SQL;
  __attrs: { [name: string]: unknown } = {};

  get __type(): ColumnType | undefined {
    return this.type;
  }

  constructor(
    core: Column | SQL,
    // `selectedName` can be undefined if `core` is a column.
    // In that case, when you call `toInput`, a name will be generated from all its joined columns,
    // so that you don't need to specify names when using joins.
    public selectedName?: string,
    public type?: ColumnType,
  ) {
    throwIfFalsy(core, 'core');
    if (core instanceof Column) {
      this.core = core;
    } else {
      this.core = core;
      if (!selectedName) {
        // Try to extract a column name from SQL expression.
        const col = core.findFirstColumn();
        if (!col) {
          throw new Error(
            'The argument `selectedName` is required for an SQL expression with no columns',
          );
        }
      }
    }
  }

  toInput(): SQLVariable {
    const { core } = this;
    let { selectedName } = this;
    if (core instanceof SQL) {
      const inferred = core.sniffType();
      if (!inferred) {
        throw new Error('Cannot convert a `RawColumn(SQL)` to an `SQLVariable`');
      }
      if (!selectedName) {
        const firstColumn = core.findFirstColumn();
        if (firstColumn && firstColumn.__name) {
          selectedName = firstColumn.__name;
        } else {
          throw new Error(
            'The argument `selectedName` is required for an SQL expression with no columns',
          );
        }
      }
      return new SQLVariable(inferred, selectedName);
    }
    const [, colName] = core.ensureInitialized();
    return new SQLVariable(core, selectedName || colName);
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
