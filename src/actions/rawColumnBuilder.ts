import { ColumnType, Column, SQLCall, RawColumn, SQL } from '../core/core';
import { convertToSQL } from '../core/sqlHelper';

export function sel(
  value: Column | SQL | SQLCall,
  selectedName: string,
  type?: ColumnType,
): RawColumn {
  // `RawColumn` constructor accepts `Column | SQL` as its `core` property.
  // We don't wrap columns to `SQL`s.
  return new RawColumn(value instanceof Column ? value : convertToSQL(value), selectedName, type);
}
