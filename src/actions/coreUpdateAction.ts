import { Action } from './ta';
import { Column } from '../core/core';
import { SQL, SQLConvertible, convertToSQL, sql } from '../core/sql';
import { throwIfFalsy } from 'throw-if-arg-empty';

export default class CoreUpdateAction extends Action {
  setters = new Map<Column, SQL>();

  set(column: Column, value: SQLConvertible): this {
    throwIfFalsy(column, 'column');
    throwIfFalsy(value, 'value');

    const { setters } = this;
    if (setters.get(column)) {
      throw new Error(
        `Column value cannot be set twice, column: "${column.__name}"`,
      );
    }
    setters.set(column, convertToSQL(value));
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
  }
}
