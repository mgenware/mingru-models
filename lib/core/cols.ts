import { throwIfFalsy } from 'throw-if-arg-empty';
import { Column } from './core';
import dt from './dt';

export function pk(): Column {
  const col = new Column(dt.BigInt);
  col.pk = true;
  col.unique = true;
  return col;
}

export function varChar(length: number, defaultValue?: string): Column {
  const col = new Column(dt.VarChar);
  col.length = length;
  col.default = defaultValue;
  return col;
}

export function char(length: number, defaultValue?: string): Column {
  const col = new Column(dt.Char);
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
  return _int(dt.Int, false, defaultValue);
}

export function unsignedInt(defaultValue?: number): Column {
  return _int(dt.Int, true, defaultValue);
}

export function bigInt(defaultValue?: number): Column {
  return _int(dt.BigInt, false, defaultValue);
}

export function unsignedBigInt(defaultValue?: number): Column {
  return _int(dt.BigInt, true, defaultValue);
}

export function smallInt(defaultValue?: number): Column {
  return _int(dt.SmallInt, false, defaultValue);
}

export function unsignedSmallInt(defaultValue?: number): Column {
  return _int(dt.SmallInt, true, defaultValue);
}

export function tinyInt(defaultValue?: number): Column {
  return _int(dt.TinyInt, false, defaultValue);
}

export function unsignedTinyInt(defaultValue?: number): Column {
  return _int(dt.TinyInt, true, defaultValue);
}

export function notNull(col: Column): Column {
  throwIfFalsy(col, 'col');
  col.notNull = true;
  return col;
}
