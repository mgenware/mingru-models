import { SQL, convertToSQL, SQLConvertible } from './sql';
import { ColumnType, Column } from './core';
import dt from './dt';
import { throwIfFalsy } from 'throw-if-arg-empty';

export enum SQLCallType {
  datetimeNow, // NOW() for DATETIME
  dateNow, // NOW() for DATE
  timeNow, // NOW() for TIME
  count, // COUNT()
  avg, // AVG()
  sum, // SUM()
  coalesce, // COALESCE()
  min, // MIN()
  max, // MAX()

  // Time related
  year,
  month,
  week,
  day,
  hour,
  minute,
  second,
}

export class SQLCall {
  params: SQL[];
  constructor(
    public type: SQLCallType,
    public returnType: ColumnType,
    params?: SQLConvertible[],
  ) {
    this.params = params ? params.map(p => convertToSQL(p)) : [];
  }

  toString(): string {
    let paramsDesc = '';
    if (this.params.length) {
      paramsDesc = `, params = ${this.params.join(', ')})`;
    }
    return `SQLCall(${
      this.type
    }, return = ${this.returnType.toString()}${paramsDesc}`;
  }
}

export function datetimeNow(): SQLCall {
  return new SQLCall(SQLCallType.datetimeNow, new ColumnType(dt.datetime));
}

export function timeNow(): SQLCall {
  return new SQLCall(SQLCallType.timeNow, new ColumnType(dt.time));
}

export function dateNow(): SQLCall {
  return new SQLCall(SQLCallType.dateNow, new ColumnType(dt.date));
}

export function count(column: SQLConvertible): SQLCall {
  return new SQLCall(SQLCallType.count, new ColumnType(dt.int), [column]);
}

export function countAll(): SQLCall {
  return count('*');
}

export function coalesce(...columns: SQLConvertible[]): SQLCall {
  throwIfFalsy(columns, 'columns');
  let type: ColumnType | null = null;
  for (const col of columns) {
    if (col instanceof Column) {
      type = col.type;
      break;
    }
  }
  if (!type) {
    throw new Error(`Cannot infer a type from all columns provided`);
  }
  return new SQLCall(SQLCallType.coalesce, type, columns);
}

export function year(column: SQLConvertible): SQLCall {
  return new SQLCall(SQLCallType.year, new ColumnType(dt.int), [column]);
}

export function month(column: SQLConvertible): SQLCall {
  return new SQLCall(SQLCallType.month, new ColumnType(dt.int), [column]);
}

export function week(column: SQLConvertible): SQLCall {
  return new SQLCall(SQLCallType.week, new ColumnType(dt.int), [column]);
}

export function day(column: SQLConvertible): SQLCall {
  return new SQLCall(SQLCallType.day, new ColumnType(dt.int), [column]);
}

export function hour(column: SQLConvertible): SQLCall {
  return new SQLCall(SQLCallType.hour, new ColumnType(dt.int), [column]);
}

export function minute(column: SQLConvertible): SQLCall {
  return new SQLCall(SQLCallType.minute, new ColumnType(dt.int), [column]);
}

export function second(column: SQLConvertible): SQLCall {
  return new SQLCall(SQLCallType.second, new ColumnType(dt.int), [column]);
}

export function min(column: SQLConvertible): SQLCall {
  return new SQLCall(SQLCallType.min, new ColumnType(dt.int), [column]);
}

export function max(column: SQLConvertible): SQLCall {
  return new SQLCall(SQLCallType.max, new ColumnType(dt.int), [column]);
}

export function avg(column: SQLConvertible): SQLCall {
  return new SQLCall(SQLCallType.avg, new ColumnType(dt.int), [column]);
}

export function sum(column: SQLConvertible): SQLCall {
  return new SQLCall(SQLCallType.sum, new ColumnType(dt.int), [column]);
}
