import { SQL } from './sql';
import { ColumnType } from './core';

export enum SQLCallType {
  localDatetimeNow, // NOW() for DATETIME
  localDateNow, // NOW() for DATE
  localTimeNow, // NOW() for TIME
  count, // COUNT()
  avg, // AVG()
  sum, // SUM()
  coalesce, // COALESCE()
  min, // MIN()
  max, // MAX()
  year,
  month,
  week,
  day,
  hour,
  minute,
  second,
  utcDatetimeNow,
  utcDateNow,
  utcTimeNow,
  timestampNow,
  exists,
  notExists,
}

export class SQLCall {
  constructor(
    public type: SQLCallType,
    public returnType: ColumnType,
    public params: SQL[],
  ) {}

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
