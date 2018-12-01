import { throwIfFalsy } from 'throw-if-arg-empty';
import { Column, ColumnBase } from '../core/core';
import toTypeString from 'to-type-string';

export class InputParam {
  constructor(public type: string | Column, public name: string) {
    throwIfFalsy(type, 'type');
    throwIfFalsy(name, 'name');
  }
}

export default function input(
  type: string | ColumnBase,
  name?: string,
): InputParam {
  if (type instanceof Column) {
    if (!name) {
      name = (type as Column).__getInputName();
      if (!name) {
        throw new Error(
          `Unexpected empty input name for column "${toTypeString(type)}"`,
        );
      }
    }
    return new InputParam((type as ColumnBase).__getTargetColumn(), name);
  }
  if (!name) {
    throw new Error(`Unexpected empty input name for type "${type}"`);
  }
  return new InputParam(type as string, name as string);
}
