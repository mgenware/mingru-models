import { throwIfFalsy } from 'throw-if-arg-empty';
import { Column } from './core';
import dt from './dt';

export function pk(): Column {
  const col = new Column(dt.bigInt);
  col.pk = true;
  col.unique = true;
  return notNull(col);
}

export function varChar(length: number, defaultValue?: string): Column {
  const col = new Column(dt.varChar);
  col.length = length;
  col.default = defaultValue;
  return col;
}

export function char(length: number, defaultValue?: string): Column {
  const col = new Column(dt.char);
  col.length = length;
  col.default = defaultValue;
  return col;
}

function _int(type: string, unsigned: boolean, def?: number): Column {
  const col = new Column(type);
  col.unsigned = unsigned;
  col.default = def;
  return col;
}

export function int(defaultValue?: number): Column {
  return _int(dt.int, false, defaultValue);
}

export function unsignedInt(defaultValue?: number): Column {
  return _int(dt.int, true, defaultValue);
}

export function bigInt(defaultValue?: number): Column {
  return _int(dt.bigInt, false, defaultValue);
}

export function unsignedBigInt(defaultValue?: number): Column {
  return _int(dt.bigInt, true, defaultValue);
}

export function smallInt(defaultValue?: number): Column {
  return _int(dt.smallInt, false, defaultValue);
}

export function unsignedSmallInt(defaultValue?: number): Column {
  return _int(dt.smallInt, true, defaultValue);
}

export function tinyInt(defaultValue?: number): Column {
  return _int(dt.tinyInt, false, defaultValue);
}

export function unsignedTinyInt(defaultValue?: number): Column {
  return _int(dt.tinyInt, true, defaultValue);
}

export function notNull(col: Column): Column {
  throwIfFalsy(col, 'col');
  col.notNull = true;
  return col;
}
