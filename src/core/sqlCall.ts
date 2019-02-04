import { SQL, toSQL, SQLConvertible } from './sql';
import { ColumnType, Column } from './core';
import dt from './dt';
import { throwIfFalsy } from 'throw-if-arg-empty';

export enum SQLCallType {
  datetimeNow,
  dateNow,
  timeNow,
  count,
  avg,
  sum,
  coalese,
}

export class SQLCall {
  params: SQL[];
  constructor(
    public type: SQLCallType,
    public returnType: ColumnType,
    params?: SQLConvertible[],
  ) {
    this.params = params ? params.map(p => toSQL(p)) : [];
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

export function coalesce(columns: SQLConvertible[]): SQLCall {
  throwIfFalsy(columns, 'columns');
  let type: ColumnType | null = null;
  for (const col of columns) {
    if (col instanceof Column) {
      type = (col as Column).type;
      break;
    }
  }
  if (!type) {
    throw new Error(`Cannot infer a type from all columns provided`);
  }
  return new SQLCall(SQLCallType.coalese, type, columns);
}
