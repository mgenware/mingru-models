import { throwIfFalsy } from 'throw-if-arg-empty';
import { Column, SQL } from '../core/core.js';
import { and } from '../sqlLangHelper.js';
import { sql } from '../core/sqlHelper.js';

export interface ActionDataWithWhere {
  whereSQLValue?: SQL;
}

export function where(action: ActionDataWithWhere, value: SQL) {
  throwIfFalsy(value, 'value');
  if (action.whereSQLValue) {
    throw new Error('`where` cannot be called twice');
  }
  // eslint-disable-next-line no-param-reassign
  action.whereSQLValue = value;
}

export function by(action: ActionDataWithWhere, column: Column, name: string | undefined) {
  throwIfFalsy(column, 'column');
  where(action, sql`${column.isEqualToInput(name)}`);
}

export function andBy(action: ActionDataWithWhere, column: Column, name: string | undefined) {
  throwIfFalsy(column, 'column');
  // Append the expr to the end of the existing WHERE expression.
  let s: SQL;
  if (action.whereSQLValue) {
    s = and(action.whereSQLValue, sql`${column.toInput(name)}`);
    // Set `whereSQLValue` to undefined cuz `where` doesn't allow `whereSQLValue` to be set twice.
    // eslint-disable-next-line no-param-reassign
    action.whereSQLValue = undefined;
  } else {
    s = sql`${column.toInput()}`;
  }
  where(action, s);
}
