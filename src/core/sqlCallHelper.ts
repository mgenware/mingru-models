import { throwIfFalsy } from 'throw-if-arg-empty';
import { ColumnType, Column } from './core';
import dt from './dt';
import { SQLCall, SQLCallType } from './sqlCall';
import SQLConvertible from './sqlConvertible';
import { sqlCall } from './sqlHelper';

export function localDatetimeNow(): SQLCall {
  return sqlCall(SQLCallType.localDatetimeNow, new ColumnType(dt.datetime));
}

export function localTimeNow(): SQLCall {
  return sqlCall(SQLCallType.localTimeNow, new ColumnType(dt.time));
}

export function localDateNow(): SQLCall {
  return sqlCall(SQLCallType.localDateNow, new ColumnType(dt.date));
}

export function utcDatetimeNow(): SQLCall {
  return sqlCall(SQLCallType.utcDatetimeNow, new ColumnType(dt.datetime));
}

export function utcTimeNow(): SQLCall {
  return sqlCall(SQLCallType.utcTimeNow, new ColumnType(dt.time));
}

export function utcDateNow(): SQLCall {
  return sqlCall(SQLCallType.utcDateNow, new ColumnType(dt.date));
}

export function timestampNow(): SQLCall {
  return sqlCall(SQLCallType.timestampNow, new ColumnType(dt.timestamp));
}

export function count(column: SQLConvertible): SQLCall {
  return sqlCall(SQLCallType.count, new ColumnType(dt.int), [column]);
}

export function countAll(): SQLCall {
  return count('*');
}

export function coalesce(...columns: SQLConvertible[]): SQLCall {
  throwIfFalsy(columns, 'columns');
  let type: ColumnType | null = null;
  for (const col of columns) {
    if (col instanceof Column) {
      type = col.__mustGetType();
      break;
    }
  }
  if (!type) {
    throw new Error('Cannot infer a type from all columns provided');
  }
  return sqlCall(SQLCallType.coalesce, type, columns);
}

export function year(column: SQLConvertible): SQLCall {
  return sqlCall(SQLCallType.year, new ColumnType(dt.int), [column]);
}

export function month(column: SQLConvertible): SQLCall {
  return sqlCall(SQLCallType.month, new ColumnType(dt.int), [column]);
}

export function week(column: SQLConvertible): SQLCall {
  return sqlCall(SQLCallType.week, new ColumnType(dt.int), [column]);
}

export function day(column: SQLConvertible): SQLCall {
  return sqlCall(SQLCallType.day, new ColumnType(dt.int), [column]);
}

export function hour(column: SQLConvertible): SQLCall {
  return sqlCall(SQLCallType.hour, new ColumnType(dt.int), [column]);
}

export function minute(column: SQLConvertible): SQLCall {
  return sqlCall(SQLCallType.minute, new ColumnType(dt.int), [column]);
}

export function second(column: SQLConvertible): SQLCall {
  return sqlCall(SQLCallType.second, new ColumnType(dt.int), [column]);
}

export function min(column: SQLConvertible): SQLCall {
  return sqlCall(SQLCallType.min, new ColumnType(dt.int), [column]);
}

export function max(column: SQLConvertible): SQLCall {
  return sqlCall(SQLCallType.max, new ColumnType(dt.int), [column]);
}

export function avg(column: SQLConvertible): SQLCall {
  return sqlCall(SQLCallType.avg, new ColumnType(dt.int), [column]);
}

export function sum(column: SQLConvertible): SQLCall {
  return sqlCall(SQLCallType.sum, new ColumnType(dt.int), [column]);
}

export function exists(expr: SQLConvertible): SQLCall {
  return sqlCall(SQLCallType.exists, new ColumnType(dt.bool), [expr]);
}

export function notExists(expr: SQLConvertible): SQLCall {
  return sqlCall(SQLCallType.notExists, new ColumnType(dt.bool), [expr]);
}

export function ifNull(expr1: SQLConvertible, expr2: SQLConvertible): SQLCall {
  return sqlCall(SQLCallType.ifNull, 0, [expr1, expr2]);
}

// Use uppercase to not conflict with the if keyword.
export function IF(cond: SQLConvertible, expr1: SQLConvertible, expr2: SQLConvertible): SQLCall {
  return sqlCall(SQLCallType.IF, 1, [cond, expr1, expr2]);
}
