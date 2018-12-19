import { throwIfFalsy } from 'throw-if-arg-empty';
import { Column } from './core';
import dt from './dt';

export function varChar(length: number, defaultValue?: string): Column {
  const col = new Column(dt.varChar);
  col.props.length = length;
  col.props.default = defaultValue;
  return col;
}

export function char(length: number, defaultValue?: string): Column {
  const col = new Column(dt.char);
  col.props.length = length;
  col.props.default = defaultValue;
  return col;
}

function _int(type: string, unsigned: boolean, def?: number): Column {
  const col = new Column(type);
  col.props.unsigned = unsigned;
  col.props.default = def;
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

export function float(defaultValue?: number): Column {
  return _int(dt.float, true, defaultValue);
}

export function double(defaultValue?: number): Column {
  return _int(dt.double, true, defaultValue);
}

export function unique(col: Column): Column {
  throwIfFalsy(col, 'col');
  col.props.unique = true;
  return col;
}

export function pk(column?: Column): Column {
  const col = column ? column : unsignedBigInt();
  col.props.pk = true;
  return col;
}

export function setName(name: string, column: Column): Column {
  throwIfFalsy(name, 'name');
  throwIfFalsy(column, 'column');
  column.__name = name;
  return column;
}

export function text(defaultValue?: string): Column {
  const col = new Column(dt.text);
  col.props.default = defaultValue;
  return col;
}

export function bool(defaultValue?: boolean): Column {
  const col = new Column(dt.bool);
  col.props.default = defaultValue;
  return col;
}

export function datetime(): Column {
  return new Column(dt.datetime);
}

export function date(): Column {
  return new Column(dt.date);
}

export function time(): Column {
  return new Column(dt.time);
}
