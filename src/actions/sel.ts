import { ColumnType, Column, SQLCall, SelectedColumn, SQL } from '../core/core.js';
import { convertToSQL } from '../core/sqlHelper.js';

// Creates a new `SelectedColumn`.
export function sel(
  value: Column | SQL | SQLCall,
  selectedName: string,
  type?: ColumnType,
): SelectedColumn {
  // `SelectedColumn` constructor accepts `Column | SQL` as its `core` property.
  // We don't wrap columns to `SQL`s.
  return new SelectedColumn(
    value instanceof Column ? value : convertToSQL(value),
    selectedName,
    type,
  );
}
