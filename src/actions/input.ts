import { throwIfFalsy } from 'throw-if-arg-empty';
import { Column, ColumnBase } from '../core/core';

export class InputParam {
  constructor(
    public name: string,
    public type: string | Column,
  ) {
    throwIfFalsy(name, 'name');
    throwIfFalsy(type, 'type');
  }
}

export default function input(types: string|ColumnBase, name?: string): InputParam {
  if (types instanceof Column) {
    if (!name) {
      name = (types as Column).__getInputName();
    }
    return new InputParam(name, (types as ColumnBase).__getTargetColumn());
  }
  // The InputParam.ctor will throw if name is undefined
  return new InputParam(name as string, types as string);
}
