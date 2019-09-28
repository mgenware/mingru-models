import { SQL, sql } from '../core/sql';
import { Table, CoreProperty, Column } from '../core/core';
import { throwIfFalsy } from 'throw-if-arg-empty';

export interface IActionWithWhere {
  __table: Table | null;
  whereSQL: SQL | null;
  whereValidator: ((value: SQL) => void) | null;
}

export function where(action: IActionWithWhere, value: SQL) {
  throwIfFalsy(value, 'value');
  if (action.whereValidator) {
    action.whereValidator(value);
  }

  if (action.whereSQL) {
    throw new Error('"where" is called twice');
  }
  action.whereSQL = value;
}

// Unsafe means it accesses `__table` which is not available during property initialization, and should be wrapped inside `CoreProperty.registerHandler`.
function byIDUnsafe(action: IActionWithWhere, inputName: string | undefined) {
  const { __table: table } = action;
  if (!table) {
    throw new Error(`Action is not initialized by dd.ta`);
  }
  if (table.__pks.length > 1) {
    throw new Error(
      `byID cannot handle tables with more than 1 PKs, table name: "${table.__name}"`,
    );
  }
  if (table.__pks.length === 0) {
    throw new Error(
      `byID cannot handle tables with no PKs, table name: "${table.__name}"`,
    );
  }
  const pk = table.__pks[0];
  where(action, pk.isEqualToInput(inputName));
}

export function byID(
  action: CoreProperty & IActionWithWhere,
  inputName?: string,
) {
  CoreProperty.registerHandler(action, () => {
    byIDUnsafe(action, inputName);
  });
}

export function by(action: IActionWithWhere, column: Column) {
  throwIfFalsy(column, 'column');
  where(action, sql`${column.toInput()}`);
}
