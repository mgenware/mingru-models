import { Action } from './ta';
import { Column } from '../core/core';
import {
  SQL,
  SQLConvertible,
  convertToSQL,
  sql,
  SQLInputList,
} from '../core/sql';
import { throwIfFalsy } from 'throw-if-arg-empty';

export default class CoreUpdateAction extends Action {
  setters = new Map<Column, SQL>();
  // Accumulated SQL inputs (based on all setters + where), will be set after validate()
  inputs!: SQLInputList;

  set(column: Column, value: SQLConvertible): this {
    throwIfFalsy(column, 'column');
    throwIfFalsy(value, 'value');
    this.setters.set(column, convertToSQL(value));
    return this;
  }

  setInputs(...columns: Column[]): this {
    throwIfFalsy(columns, 'columns');
    const { setters } = this;
    for (const col of columns) {
      if (setters.get(col)) {
        throw new Error(
          `Column value cannot be set twice, column: "${col.__name}"`,
        );
      }
      this.setters.set(col, sql`${col.toInput()}`);
    }
    return this;
  }

  validate() {
    super.validate();
    if (!this.setters.size) {
      throw new Error(`No setters in action "${this.__name}"`);
    }
    // Set inputs
    const inputs = new SQLInputList();
    // Merge setter inputs
    for (const [, setter] of this.setters) {
      if (setter.inputs.length) {
        inputs.merge(setter.inputs);
      }
    }
    this.inputs = inputs;
  }

  getInputs(): SQLInputList {
    return this.inputs;
  }
}
