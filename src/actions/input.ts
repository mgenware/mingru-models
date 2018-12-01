import { throwIfFalsy } from 'throw-if-arg-empty';
import { Column, ColumnBase } from '../core/core';

export class InputParam {
  constructor(public type: string | Column, public name: string) {
    throwIfFalsy(type, 'type');
    throwIfFalsy(name, 'name');
  }
}

export default function input(
  types: string | ColumnBase,
  name?: string,
): InputParam {
  if (types instanceof Column) {
    if (!name) {
      name = (types as Column).__getInputName();
    }
    return new InputParam((types as ColumnBase).__getTargetColumn(), name);
  }
  // The InputParam.ctor will throw if name is undefined
  return new InputParam(types as string, name as string);
}
