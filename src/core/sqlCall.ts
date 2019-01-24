import { SQL, toSQL, SQLParam } from './sql';

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
  constructor(public type: SQLCallType, params?: SQLParam[]) {
    this.params = params ? params.map(p => toSQL(p)) : [];
  }
}

export function datetimeNow() {
  return new SQLCall(SQLCallType.datetimeNow);
}

export function timeNow() {
  return new SQLCall(SQLCallType.timeNow);
}

export function dateNow() {
  return new SQLCall(SQLCallType.dateNow);
}

export function count(column: SQLParam) {
  return new SQLCall(SQLCallType.count, [column]);
}
