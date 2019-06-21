import { Action } from './ta';
import { Column } from '../core/core';
import { SQL, SQLConvertible, convertToSQL, sql } from '../core/sql';
import { throwIfFalsy } from 'throw-if-arg-empty';

export default class CoreUpdateAction extends Action {
  setters = new Map<Column, SQL>();
  allSet: '' | 'defaults' | 'inputs' = '';

  set(column: Column, value: SQLConvertible): this {
    throwIfFalsy(column, 'column');
    throwIfFalsy(value, 'value');
    this.checkNotAllSet();

    const { setters } = this;
    this.checkColumnFree(column);
    setters.set(column, convertToSQL(value));
    return this;
  }

  setInputs(...columns: Column[]): this {
    this.checkNotAllSet();
    if (!columns.length) {
      this.allSet = 'inputs';
      return this;
    }
    for (const col of columns) {
      this.checkColumnFree(col);
      this.setters.set(col, sql`${col.toInput()}`);
    }
    return this;
  }

  setDefaults(...columns: Column[]): this {
    this.checkNotAllSet();
    if (!columns.length) {
      this.allSet = 'defaults';
      // We can't check whether all remaining columns have a default value cuz this.__table is null here
      // We check it in validate()
      return this;
    }
    for (const col of columns) {
      this.checkColumnFree(col);
      this.checkHasDefault(col);
      const defaultValueStr = `${col.defaultValue}`;
      this.setters.set(col, sql`${defaultValueStr}`);
    }
    return this;
  }

  validate() {
    super.validate();
    if (!this.setters.size && !this.allSet) {
      throw new Error(`No setters in action "${this.__name}"`);
    }
  }

  // Mostly for testing
  settersToString(): string {
    return [...this.setters.entries()]
      .map(([k, v]) => `${k.__name}: ${v.toString()}`)
      .join(', ');
  }

  private checkNotAllSet() {
    if (this.allSet) {
      throw new Error(`All columns are already set to ${this.allSet}`);
    }
  }

  private checkColumnFree(col: Column) {
    if (this.setters.has(col)) {
      throw new Error(`Column "${col.__name}" is already set`);
    }
  }

  private checkHasDefault(col: Column) {
    const def = col.defaultValue;
    if (def === undefined || def === null) {
      throw new Error(
        `The column "${col.__name}" does not have a default value`,
      );
    }
  }
}
