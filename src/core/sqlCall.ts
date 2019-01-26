import { SQL, toSQL, SQLConvertible } from './sql';
import { ColumnType } from './core';
import dt from './dt';

export enum SQLCallType {
  datetimeNow,
  dateNow,
  timeNow,
  count,
  avg,
  sum,
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

export function datetimeNow() {
  return new SQLCall(SQLCallType.datetimeNow, new ColumnType(dt.datetime));
}

export function timeNow() {
  return new SQLCall(SQLCallType.timeNow, new ColumnType(dt.time));
}

export function dateNow() {
  return new SQLCall(SQLCallType.dateNow, new ColumnType(dt.date));
}

export function count(column: SQLConvertible) {
  return new SQLCall(SQLCallType.count, new ColumnType(dt.int), [column]);
}
