import { throwIfFalsy } from 'throw-if-arg-empty';
import { Action, ActionData } from './tableActions';
import { Column, Table } from '../core/core';
import SQLConvertible from '../core/sqlConvertible';
import { convertToSQL, sql } from '../core/sqlHelper';

export enum AutoSetterType {
  default = 1,
  input,
}

export interface CoreUpdateActionData extends ActionData {
  setters?: Map<Column, unknown>;
  // You can call both `setInputs()` and `setDefaults()` and the order also matters,
  // we use ES6 `Set` to track those auto setters, which keeps insertion order.
  autoSetters?: Set<AutoSetterType>;
}

export class CoreUpdateAction extends Action {
  #data = this.__data as CoreUpdateActionData;

  private mustGetSetters(): Map<Column, unknown> {
    return (this.#data.setters ??= new Map<Column, unknown>());
  }

  private mustGetAutoSetters(): Set<AutoSetterType> {
    return (this.#data.autoSetters ??= new Set<AutoSetterType>());
  }

  set(column: Column, value: SQLConvertible): this {
    throwIfFalsy(column, 'column');
    throwIfFalsy(value, 'value');

    this.checkColumnFree(column);
    this.mustGetSetters().set(column, convertToSQL(value));
    return this;
  }

  setInputs(...columns: Column[]): this {
    if (!columns.length) {
      this.mustGetAutoSetters().add(AutoSetterType.input);
      return this;
    }
    for (const col of columns) {
      this.checkColumnFree(col);
      this.mustGetSetters().set(col, sql`${col.toInput()}`);
    }
    return this;
  }

  setDefaults(...columns: Column[]): this {
    if (!columns.length) {
      this.mustGetAutoSetters().add(AutoSetterType.default);
      // We don't know if all other columns have a default value as
      // `this.__table` could be null at the point.
      // We'll check it later in `onInit()`.
      return this;
    }
    for (const col of columns) {
      this.checkColumnFree(col);
      this.checkHasDefault(col);
      this.mustGetSetters().set(col, col.__getData().defaultValue);
    }
    return this;
  }

  __validate(groupTable: Table) {
    super.__validate(groupTable);
    if (!this.#data.setters && !this.#data.autoSetters) {
      throw new Error('No setters');
    }
  }

  __settersToString(): string {
    return [...this.mustGetSetters().entries()]
      .map(([k, v]) => `${k.__getData().name}: ${v}`)
      .join(', ');
  }

  private checkColumnFree(col: Column) {
    if (this.#data.setters?.has(col)) {
      throw new Error(`Column "${col}" is already set`);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private checkHasDefault(col: Column) {
    const def = col.__getData().defaultValue;
    if (def === undefined || def === null) {
      throw new Error(`The column "${col}" does not have a default value`);
    }
  }
}
