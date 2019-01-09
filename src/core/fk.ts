import { Column } from './core';
import { throwIfFalsy } from 'throw-if-arg-empty';
import toTypeString from 'to-type-string';

export function fk(column: Column): Column {
  throwIfFalsy(column, 'column');
  if (!Object.isFrozen(column)) {
    throw new Error(
      `The column "${toTypeString(
        column,
      )}" doesn't seem to be a valid column because it is frozen`,
    );
  }
  const col = Column.spawn(column);
  col.props.foreignColumn = column;
  return col;
}
