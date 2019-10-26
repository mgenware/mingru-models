import { Action } from './tableActions';
import { Column, Table } from '../core/core';
import { SQL, SQLConvertible, convertToSQL, sql } from '../core/sql';
import { throwIfFalsy } from 'throw-if-arg-empty';

export type AutoSetterType = '' | 'default' | 'input';

export class CoreUpdateAction extends Action {
  setters = new Map<Column, SQL>();
  autoSetter: AutoSetterType = '';

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
      this.autoSetter = 'input';
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
      this.autoSetter = 'default';
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

  validate(table: Table, name: string) {
    super.validate(table, name);
    if (!this.setters.size && !this.autoSetter) {
      throw new Error(`No setters`);
    }
  }

  // Mostly for testing
  settersToString(): string {
    return [...this.setters.entries()]
      .map(([k, v]) => `${k.__name}: ${v.toString()}`)
      .join(', ');
  }

  private checkNotAllSet() {
    if (this.autoSetter) {
      throw new Error(`All columns are already set to ${this.autoSetter}s`);
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
