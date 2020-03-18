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

export function varChar(length: number, defaultValue?: string | null): Column {
  const col = Column.fromTypes(dt.varChar);
  col.__type.length = length;
  col.__defaultValue = defaultValue;
  return col;
}

export function char(length: number, defaultValue?: string | null): Column {
  const col = Column.fromTypes(dt.char);
  col.__type.length = length;
  col.__defaultValue = defaultValue;
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

function _int(type: string, unsigned: boolean, def?: number | null): Column {
  const col = Column.fromTypes(type);
  col.__type.unsigned = unsigned;
  col.__defaultValue = def;
  return col;
}

export function int(defaultValue?: number | null): Column {
  return _int(dt.int, false, defaultValue);
}

export function uInt(defaultValue?: number | null): Column {
  return _int(dt.int, true, defaultValue);
}

export function bigInt(defaultValue?: number | null): Column {
  return _int(dt.bigInt, false, defaultValue);
}

export function uBigInt(defaultValue?: number | null): Column {
  return _int(dt.bigInt, true, defaultValue);
}

export function smallInt(defaultValue?: number | null): Column {
  return _int(dt.smallInt, false, defaultValue);
}

export function uSmallInt(defaultValue?: number | null): Column {
  return _int(dt.smallInt, true, defaultValue);
}

export function tinyInt(defaultValue?: number | null): Column {
  return _int(dt.tinyInt, false, defaultValue);
}

export function uTinyInt(defaultValue?: number | null): Column {
  return _int(dt.tinyInt, true, defaultValue);
}

export function float(defaultValue?: number | null): Column {
  return _int(dt.float, true, defaultValue);
}

export function double(defaultValue?: number | null): Column {
  return _int(dt.double, true, defaultValue);
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

export function text(defaultValue?: string | null): Column {
  const col = Column.fromTypes(dt.text);
  col.__defaultValue = defaultValue;
  return col;
}

export function bool(defaultValue?: boolean | null): Column {
  const col = Column.fromTypes(dt.bool);
  col.__defaultValue = defaultValue;
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
