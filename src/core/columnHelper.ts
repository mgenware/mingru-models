import { throwIfFalsy } from 'throw-if-arg-empty';
import { Column } from './core.js';
import dt from './dt.js';
import * as call from './sqlCallHelper.js';
import { sql } from './sqlHelper.js';

export type DateTimeDefaultValue = 'none' | 'local' | 'utc';

export function fk(column: Column): Column {
  throwIfFalsy(column, 'column');
  if (!Object.isFrozen(column)) {
    throw new Error(`The column "${column}" is not sealed yet`);
  }
  return Column.newForeignColumn(column, null);
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

export function datetime(defaultsToNow: DateTimeDefaultValue = 'none'): Column {
  return Column.fromTypes(
    dt.datetime,
    defaultsToNow
      ? sql`${defaultsToNow === 'utc' ? call.utcDatetimeNow() : call.localDatetimeNow()}`
      : undefined,
  );
}

export function date(defaultsToNow: DateTimeDefaultValue = 'none'): Column {
  return Column.fromTypes(
    dt.date,
    defaultsToNow
      ? sql`${defaultsToNow === 'utc' ? call.utcDateNow() : call.localDateNow()}`
      : undefined,
  );
}

export function time(defaultsToNow: DateTimeDefaultValue = 'none'): Column {
  return Column.fromTypes(
    dt.time,
    defaultsToNow
      ? sql`${defaultsToNow === 'utc' ? call.utcTimeNow() : call.localTimeNow()}`
      : undefined,
  );
}

export function timestamp(defaultsToNow = false): Column {
  return Column.fromTypes(dt.timestamp, defaultsToNow ? sql`${call.timestampNow()}` : undefined);
}
