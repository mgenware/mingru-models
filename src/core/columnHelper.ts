import { Column, ColumnType, SQL } from './core.js';
import dt from './dt.js';
import * as call from './sqlCallHelper.js';
import { sql } from './sqlHelper.js';

let defDateFsp = 0;
let defDateTimeFsp = 0;
let defTimeFsp = 0;
let defTimestampFsp = 0;

export function setDefaultDateFSP(fsp: number) {
  defDateFsp = fsp;
}

export function setDefaultDatetimeFSP(fsp: number) {
  defDateTimeFsp = fsp;
}

export function setDefaultTimeFSP(fsp: number) {
  defTimeFsp = fsp;
}

export function setDefaultTimestampFSP(fsp: number) {
  defTimestampFsp = fsp;
}

export type DateTimeDefaultValue = 'local' | 'utc';

export function fk(column: Column): Column {
  return Column.newForeignColumn(column);
}

export function varChar(length: number): Column {
  const col = Column.fromTypes(dt.varChar);
  col.__type().length = length;
  return col;
}

export function char(length: number): Column {
  const col = Column.fromTypes(dt.char);
  col.__type().length = length;
  return col;
}

export function varBinary(length: number): Column {
  const col = Column.fromTypes(dt.varBinary);
  col.__type().length = length;
  return col;
}

export function binary(length: number): Column {
  const col = Column.fromTypes(dt.binary);
  col.__type().length = length;
  return col;
}

function numeric(type: string, unsigned: boolean, length?: number): Column {
  const col = Column.fromTypes(type);
  col.__type().unsigned = unsigned;
  if (length !== undefined) {
    if (length === 0) {
      throw new Error('You should omit length parameter instead of passing a zero');
    }
    col.__type().length = length;
  }
  return col;
}

export function int(length?: number): Column {
  return numeric(dt.int, false, length);
}

export function uInt(length?: number): Column {
  return numeric(dt.int, true, length);
}

export function bigInt(length?: number): Column {
  return numeric(dt.bigInt, false, length);
}

export function uBigInt(length?: number): Column {
  return numeric(dt.bigInt, true, length);
}

export function smallInt(length?: number): Column {
  return numeric(dt.smallInt, false, length);
}

export function uSmallInt(length?: number): Column {
  return numeric(dt.smallInt, true, length);
}

export function tinyInt(length?: number): Column {
  return numeric(dt.tinyInt, false, length);
}

export function uTinyInt(length?: number): Column {
  return numeric(dt.tinyInt, true, length);
}

export function float(precision?: number): Column {
  return numeric(dt.float, false, precision);
}

export function double(precision?: number): Column {
  return numeric(dt.double, false, precision);
}

export function decimal(length: number, scale: number): Column {
  const col = Column.fromTypes(dt.decimal);
  const colType = col.__type();
  colType.length = length;
  colType.extraLength = scale;
  return col;
}

export function pk(column?: Column): Column {
  let col: Column;
  if (column) {
    col = column;
  } else {
    col = uBigInt();
    col.__type().autoIncrement = true;
  }
  if (Object.isFrozen(col)) {
    // col is from another table, therefore an implicit FK
    col = fk(col);
  }
  col.__type().pk = true;
  return col;
}

export function text(): Column {
  return Column.fromTypes(dt.text);
}

export function bool(): Column {
  return Column.fromTypes(dt.bool);
}

export interface TimeOptions {
  defaultToNow?: DateTimeDefaultValue;
  // See https://dev.mysql.com/doc/refman/5.6/en/fractional-seconds.html.
  fsp?: number;
}

function createDateTimeCol(type: string, defVal: SQL | undefined, fsp: number) {
  const colType = new ColumnType(type);
  colType.length = fsp;
  const col = new Column(colType);
  col.__getData().defaultValue = defVal;
  return col;
}

export function datetime(opt?: TimeOptions): Column {
  const fsp = opt?.fsp ?? defDateTimeFsp;
  let defVal: SQL | undefined;
  if (opt?.defaultToNow) {
    if (opt.defaultToNow === 'utc') {
      defVal = sql`${call.utcDatetimeNow(fsp)}`;
    } else {
      defVal = sql`${call.localDatetimeNow(fsp)}`;
    }
  }
  return createDateTimeCol(dt.datetime, defVal, fsp);
}

export function date(opt?: TimeOptions): Column {
  const fsp = opt?.fsp ?? defDateFsp;
  let defVal: SQL | undefined;
  if (opt?.defaultToNow) {
    if (opt.defaultToNow === 'utc') {
      defVal = sql`${call.utcDateNow(fsp)}`;
    } else {
      defVal = sql`${call.localDateNow(fsp)}`;
    }
  }
  return createDateTimeCol(dt.date, defVal, fsp);
}

export function time(opt?: TimeOptions): Column {
  const fsp = opt?.fsp ?? defTimeFsp;
  let defVal: SQL | undefined;
  if (opt?.defaultToNow) {
    if (opt.defaultToNow === 'utc') {
      defVal = sql`${call.utcTimeNow(fsp)}`;
    } else {
      defVal = sql`${call.localTimeNow(fsp)}`;
    }
  }
  return createDateTimeCol(dt.time, defVal, fsp);
}

export function timestamp(opt?: TimeOptions): Column {
  if (opt?.defaultToNow === 'local') {
    throw new Error('"local" is not support in TIMESTAMP, use "utc" instead.');
  }
  const fsp = opt?.fsp ?? defTimestampFsp;
  let defVal: SQL | undefined;
  if (opt?.defaultToNow) {
    defVal = sql`${call.timestampNow(fsp)}`;
  }
  return createDateTimeCol(dt.timestamp, defVal, fsp);
}
