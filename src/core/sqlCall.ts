export enum SQLCallType {
  datetimeNow,
  dateNow,
  timeNow,
  count,
  avg,
  sum,
}

export class SQLCall {
  params: Array<unknown>;
  constructor(public type: SQLCallType, params?: Array<unknown>) {
    this.params = params || [];
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

export function count(column: unknown) {
  return new SQLCall(SQLCallType.count, [column]);
}
