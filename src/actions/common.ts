import { throwIfFalsy } from 'throw-if-arg-empty';
import { SQL } from '../core/sql';
import { Table, CoreProperty, Column } from '../core/core';
import { and } from '../sqlLangHelper';
import { sql } from '../core/sqlHelper';

export interface ActionWithWhere {
  __table: Table | null;
  whereSQLValue: SQL | null;
  whereValidator: ((value: SQL) => void) | null;
}

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

// Unsafe means it accesses `__table` which is not available during property initialization,
// and should be wrapped inside `CoreProperty.registerHandler`.
function byIDUnsafe(action: ActionWithWhere, inputName: string | undefined) {
  const { __table: table } = action;
  if (!table) {
    throw new Error('Action is not initialized by `mm.ta`');
  }
  if (table.__pks.length > 1) {
    throw new Error(
      `\`byID\` cannot handle tables with more than 1 PKs, table name: "${table.__name}"`,
    );
  }
  if (table.__pks.length === 0) {
    throw new Error(
      `\`byID\` cannot handle tables with no PKs, table name: "${table.__name}"`,
    );
  }
  const pk = table.__pks[0];
  where(action, pk.isEqualToInput(inputName));
}

export function byID(
  action: CoreProperty & ActionWithWhere,
  inputName?: string,
) {
  CoreProperty.registerHandler(action, () => {
    byIDUnsafe(action, inputName);
  });
}

export function by(action: ActionWithWhere, column: Column) {
  throwIfFalsy(column, 'column');
  where(action, sql`${column.isEqualToInput()}`);
}

export function andBy(action: CoreProperty & ActionWithWhere, column: Column) {
  throwIfFalsy(column, 'column');
  CoreProperty.registerHandler(action, () => {
    // Combine existing WHERE expression.
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
  });
}
