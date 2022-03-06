import { throwIfFalsy } from 'throw-if-arg-empty';
import { Column, ColumnType, SQL } from './core.js';
import dt from './dt.js';
import * as call from './sqlCallHelper.js';
import { sql } from './sqlHelper.js';

export type DateTimeDefaultValue = 'none' | 'local' | 'utc';

export function fk(column: Column): Column {
  throwIfFalsy(column, 'column');
  if (!Object.isFrozen(column)) {
    throw new Error(`The column "${column}" is not sealed yet`);
  }
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
  defaultsToNow?: DateTimeDefaultValue;
  // See https://dev.mysql.com/doc/refman/5.6/en/fractional-seconds.html.
  fsp?: number;
}

function createDateTimeCol(type: string, opt: TimeOptions | undefined, forcedNowValue?: SQL) {
  let defValue: unknown;
  if (opt?.defaultsToNow) {
    defValue =
      forcedNowValue ??
      sql`${opt.defaultsToNow === 'utc' ? call.utcDatetimeNow() : call.localDatetimeNow()}`;
  }
  const colType = new ColumnType(type);
  if (opt?.fsp) {
    colType.length = opt.fsp;
  }
  const col = new Column(colType);
  col.__getData().defaultValue = defValue;
  return col;
}

export function datetime(opt?: TimeOptions): Column {
  return createDateTimeCol(dt.datetime, opt);
}

export function date(opt?: TimeOptions): Column {
  return createDateTimeCol(dt.date, opt);
}

export function time(opt?: TimeOptions): Column {
  return createDateTimeCol(dt.time, opt);
}

export function timestamp(opt?: TimeOptions): Column {
  if (opt?.defaultsToNow === 'local') {
    throw new Error('"local" is not support in TIMESTAMP, use "utc" instead.');
  }
  return createDateTimeCol(dt.timestamp, opt, sql`${call.timestampNow()}`);
}
