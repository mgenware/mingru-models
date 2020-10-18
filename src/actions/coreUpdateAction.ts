import { throwIfFalsy } from 'throw-if-arg-empty';
import { Action } from './tableActions';
import { Column, Table } from '../core/core';
import SQLConvertible from '../core/sqlConvertible';
import { convertToSQL, sql } from '../core/sqlHelper';

export enum AutoSetterType {
  default = 1,
  input,
}

export class CoreUpdateAction extends Action {
  setters = new Map<Column, unknown>();
  // You can call both `setInputs()` and `setDefaults()` and the order also matters,
  // we use `Set` to track these auto setters and ES6 set also keeps insertion order.
  autoSetters = new Set<AutoSetterType>();

  set(column: Column, value: SQLConvertible): this {
    throwIfFalsy(column, 'column');
    throwIfFalsy(value, 'value');

    const { setters } = this;
    this.checkColumnFree(column);
    setters.set(column, convertToSQL(value));
    return this;
  }

  setInputs(...columns: Column[]): this {
    if (!columns.length) {
      this.autoSetters.add(AutoSetterType.input);
      return this;
    }
    for (const col of columns) {
      this.checkColumnFree(col);
      this.setters.set(col, sql`${col.toInput()}`);
    }
    return this;
  }

  setDefaults(...columns: Column[]): this {
    if (!columns.length) {
      this.autoSetters.add(AutoSetterType.default);
      // We don't know if all other columns have a default value as `this.__table` could be null at the point.
      // We'll check it later in `onInit()`.
      return this;
    }
    for (const col of columns) {
      this.checkColumnFree(col);
      this.checkHasDefault(col);
      this.setters.set(col, col.__defaultValue);
    }
    return this;
  }

  validate(groupTable: Table) {
    super.validate(groupTable);
    if (!this.setters.size && !this.autoSetters.size) {
      throw new Error('No setters');
    }
  }

  settersToString(): string {
    return [...this.setters.entries()].map(([k, v]) => `${k.__name}: ${v}`).join(', ');
  }

  private checkColumnFree(col: Column) {
    if (this.setters.has(col)) {
      throw new Error(`Column "${col.__name}" is already set`);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private checkHasDefault(col: Column) {
    const def = col.__defaultValue;
    if (def === undefined || def === null) {
      throw new Error(`The column "${col.__name}" does not have a default value`);
    }
  }
}
