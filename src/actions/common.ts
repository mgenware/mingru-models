import { throwIfFalsy } from 'throw-if-arg-empty';
import { SQL } from '../core/sql';
import { Table, Column, ColumnType } from '../core/core';
import { and } from '../sqlLangHelper';
import { sql } from '../core/sqlHelper';

export interface ActionWithWhere {
  __table: Table | null;
  whereSQLValue: SQL | null;
  whereValidator: ((value: SQL) => void) | null;
}

// A placeholder column representing the ID column of a table.
export const idColumn = new Column(new ColumnType('__id__'));

export function where(action: ActionWithWhere, value: SQL) {
  throwIfFalsy(value, 'value');
  if (action.whereValidator) {
    action.whereValidator(value);
  }

  if (action.whereSQLValue) {
    throw new Error('`where` cannot be called twice');
  }
  // eslint-disable-next-line no-param-reassign
  action.whereSQLValue = value;
}

export function byID(action: ActionWithWhere, inputName?: string) {
  where(action, idColumn.isEqualToInput(inputName));
}

export function by(action: ActionWithWhere, column: Column) {
  throwIfFalsy(column, 'column');
  where(action, sql`${column.isEqualToInput()}`);
}

export function andBy(action: ActionWithWhere, column: Column) {
  throwIfFalsy(column, 'column');
  // Append the expr to the end of the existing WHERE expression.
  let s: SQL;
  if (action.whereSQLValue) {
    s = and(action.whereSQLValue, sql`${column.toInput()}`);
    // Set `whereSQLValue` to null cuz `where` doesn't allow `whereSQLValue` to be set twice.
    // eslint-disable-next-line no-param-reassign
    action.whereSQLValue = null;
  } else {
    s = sql`${column.toInput()}`;
  }
  where(action, s);
}
