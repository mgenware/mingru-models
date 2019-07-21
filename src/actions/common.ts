import { SQL } from '../core/sql';
import { Table } from '../core/core';

export interface IActionWithWhere {
  __table: Table | null;
  whereSQL: SQL | null;
  whereValidator: ((value: SQL) => void) | null;
}

export function where(action: IActionWithWhere, value: SQL) {
  if (action.whereValidator) {
    action.whereValidator(value);
  }

  if (action.whereSQL) {
    throw new Error('"where" is called twice');
  }
  action.whereSQL = value;
}

// Unsafe means it accesses `__table` which is not available during property initialization, and should be wrapped inside `CoreProperty.registerHandler`.
export function byIDUnsafe(
  action: IActionWithWhere,
  inputName: string | undefined,
) {
  const { __table: table } = action;
  if (!table) {
    throw new Error(`Action is not initialized by dd.ta`);
  }
  if (table.__pks.length > 1) {
    throw new Error(
      `byID cannot handle tables with more than 1 PKs, table name: "${
        table.__name
      }"`,
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
