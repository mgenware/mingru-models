import { throwIfFalsy } from 'throw-if-arg-empty';
import { Column } from './core';
import { sql } from '../core/sql';
import dt from './dt';
import * as call from './sqlCall';
import toTypeString from 'to-type-string';

export type DateTimeDefaultValue = 'none' | 'local' | 'utc';

export function fk(column: Column): Column {
  throwIfFalsy(column, 'column');
  if (!Object.isFrozen(column)) {
    throw new Error(
      `The column "${toTypeString(
        column,
      )}" doesn't seem to be a valid column because it is frozen`,
    );
  }
  return Column.newForeignColumn(column, null);
}

export function varChar(length: number): Column {
  const col = Column.fromTypes(dt.varChar);
  col.__type.length = length;
  return col;
}

export function char(length: number): Column {
  const col = Column.fromTypes(dt.char);
  col.__type.length = length;
  return col;
}

export function varBinary(length: number): Column {
  const col = Column.fromTypes(dt.varBinary);
  col.__type.length = length;
  return col;
}

export function binary(length: number): Column {
  const col = Column.fromTypes(dt.binary);
  col.__type.length = length;
  return col;
}

function _int(type: string, unsigned: boolean, length?: number): Column {
  const col = Column.fromTypes(type);
  col.__type.unsigned = unsigned;
  if (length !== undefined) {
    col.__type.length = length;
  }
  return col;
}

export function int(length?: number): Column {
  return _int(dt.int, false, length);
}

export function uInt(length?: number): Column {
  return _int(dt.int, true, length);
}

export function bigInt(length?: number): Column {
  return _int(dt.bigInt, false, length);
}

export function uBigInt(length?: number): Column {
  return _int(dt.bigInt, true, length);
}

export function smallInt(length?: number): Column {
  return _int(dt.smallInt, false, length);
}

export function uSmallInt(length?: number): Column {
  return _int(dt.smallInt, true, length);
}

export function tinyInt(length?: number): Column {
  return _int(dt.tinyInt, false, length);
}

export function uTinyInt(length?: number): Column {
  return _int(dt.tinyInt, true, length);
}

export function float(length?: number): Column {
  return _int(dt.float, true, length);
}

export function double(length?: number): Column {
  return _int(dt.double, true, length);
}

export function unique(col: Column): Column {
  throwIfFalsy(col, 'col');
  col.__type.unique = true;
  return col;
}

export function pk(column?: Column): Column {
  let col: Column;
  if (column) {
    col = column;
  } else {
    col = uBigInt();
    col.__type.autoIncrement = true;
  }
  if (Object.isFrozen(col)) {
    // col is from another table, therefore an implicit FK
    col = Column.newForeignColumn(col, null);
  }
  col.__type.pk = true;
  return col;
}

export function text(): Column {
  const col = Column.fromTypes(dt.text);
  return col;
}

export function bool(): Column {
  const col = Column.fromTypes(dt.bool);
  return col;
}

export function datetime(defaultsToNow: DateTimeDefaultValue = 'none'): Column {
  const col = Column.fromTypes(dt.datetime);
  if (defaultsToNow) {
    col.__defaultValue = sql`${
      defaultsToNow === 'utc' ? call.utcDatetimeNow() : call.localDatetimeNow()
    }`;
  }
  return col;
}

export function date(defaultsToNow: DateTimeDefaultValue = 'none'): Column {
  const col = Column.fromTypes(dt.date);
  if (defaultsToNow) {
    col.__defaultValue = sql`${
      defaultsToNow === 'utc' ? call.utcDateNow() : call.localDateNow()
    }`;
  }
  return col;
}

export function time(defaultsToNow: DateTimeDefaultValue = 'none'): Column {
  const col = Column.fromTypes(dt.time);
  if (defaultsToNow) {
    col.__defaultValue = sql`${
      defaultsToNow === 'utc' ? call.utcTimeNow() : call.localTimeNow()
    }`;
  }
  return col;
}
