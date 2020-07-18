import { ColumnType, Column } from '../core/core';
import { RawColumn } from './rawColumn';
import { convertToSQL } from '../core/sqlHelper';
import { SQLCall } from '../core/sqlCall';
import { SQL } from '../core/sql';

export function sel(
  value: Column | SQL | SQLCall,
  selectedName: string,
  type?: ColumnType,
): RawColumn {
  // RawColumn constructor accepts Column | SQL as its core property.
  // We don't wrap columns to SQLs.
  return new RawColumn(
    value instanceof Column ? value : convertToSQL(value),
    selectedName,
    type,
  );
}
