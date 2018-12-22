export enum SQLCallType {
  datetimeNow,
  dateNow,
  timeNow,
}

export class SQLCall {
  constructor(public type: SQLCallType) {}
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
