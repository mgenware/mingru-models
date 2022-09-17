import { Action, ActionData } from './actionGroup.js';
import { Column, SQLVariable, Table } from '../core/core.js';
import SQLConvertible from '../core/sqlConvertible.js';
import { convertToSQL, ParamAttributes, sql } from '../core/sqlHelper.js';

export enum AutoSetterType {
  default = 1,
  param,
}

export interface CoreUpdateActionData extends ActionData {
  setters?: Map<Column, SQLConvertible>;
  // You can call both `setParams()` and `setDefaults()` and the order also matters,
  // we use ES6 `Set` to track those auto setters, which keeps insertion order.
  autoSetters?: Set<AutoSetterType>;
  autoSetterParamsOpt?: SetParamsOptions;
}

export interface SetParamsOptions {
  toParamOpt?: ParamAttributes;
  toParamCallback?: (col: Column) => SQLVariable;
}

export class CoreUpdateAction extends Action {
  #data = this.__data as CoreUpdateActionData;
  override __getData(): CoreUpdateActionData {
    return this.#data;
  }

  private mustGetSetters(): Map<Column, unknown> {
    return (this.#data.setters ??= new Map<Column, SQLConvertible>());
  }

  private mustGetAutoSetters(): Set<AutoSetterType> {
    return (this.#data.autoSetters ??= new Set<AutoSetterType>());
  }

  set(column: Column, value: SQLConvertible): this {
    this.checkColumnFree(column);
    this.mustGetSetters().set(column, convertToSQL(value));
    return this;
  }

  setParams(...columns: Column[]): this {
    return this.setParamsAdv(columns);
  }

  setParamsAdv(columns: Column[], opt?: SetParamsOptions): this {
    if (!columns.length) {
      this.mustGetAutoSetters().add(AutoSetterType.param);
      this.#data.autoSetterParamsOpt = opt;
      return this;
    }
    for (const col of columns) {
      const param = opt?.toParamCallback
        ? opt.toParamCallback(col)
        : col.toParam(undefined, opt?.toParamOpt);
      this.checkColumnFree(col);
      this.mustGetSetters().set(col, sql`${param}`);
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

  override __validate(table: Table) {
    super.__validate(table);
    if (!this.#data.setters && !this.#data.autoSetters) {
      throw new Error('No setters');
    }
  }

  __settersToString(): string {
    return [...this.mustGetSetters().entries()]
      .map(([k, v]) => `${k.__mustGetPropertyName()}: ${v}`)
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
