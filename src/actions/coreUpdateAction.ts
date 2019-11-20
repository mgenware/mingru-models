import { Action } from './tableActions';
import { Column, Table } from '../core/core';
import { SQL, SQLConvertible, convertToSQL, sql } from '../core/sql';
import { throwIfFalsy } from 'throw-if-arg-empty';

export enum AutoSetterType {
  default = 1,
  input,
}

export class CoreUpdateAction extends Action {
  setters = new Map<Column, SQL>();
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
      // We can't check whether all remaining columns have a default value cuz this.__table is null here
      // We check it in validate()
      return this;
    }
    for (const col of columns) {
      this.checkColumnFree(col);
      this.checkHasDefault(col);
      const defaultValueStr = `${col.__defaultValue}`;
      this.setters.set(col, sql`${defaultValueStr}`);
    }
    return this;
  }

  validate(table: Table, name: string) {
    super.validate(table, name);
    if (!this.setters.size && !this.autoSetters.size) {
      throw new Error(`No setters`);
    }
  }

  // Mostly for testing
  settersToString(): string {
    return [...this.setters.entries()]
      .map(([k, v]) => `${k.__name}: ${v.toString()}`)
      .join(', ');
  }

  private checkColumnFree(col: Column) {
    if (this.setters.has(col)) {
      throw new Error(`Column "${col.__name}" is already set`);
    }
  }

  private checkHasDefault(col: Column) {
    const def = col.__defaultValue;
    if (def === undefined || def === null) {
      throw new Error(
        `The column "${col.__name}" does not have a default value`,
      );
    }
  }
}
