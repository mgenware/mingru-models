import { Column } from './core';
import { throwIfFalsy } from 'throw-if-arg-empty';
import toTypeString from 'to-type-string';

export class FKWrapper {
  isNullable = false;
  customName: string | null = null;
  constructor(public column: Column) {}

  get nullable(): this {
    this.isNullable = true;
    return this;
  }

  setName(name: string): this {
    throwIfFalsy(name, 'name');
    this.customName = name;
    return this;
  }
}

export function fk(column: Column): Column {
  if (!Object.isFrozen(column)) {
    throw new Error(
      `The column "${toTypeString(
        column,
      )}" doesn't seem to be a foreign column because it is frozen`,
    );
  }

  const res = Column.fromColumn(column);
  res.props.fk = column;
  return res;
}
