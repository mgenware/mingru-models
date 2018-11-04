import { throwIfFalsy } from 'throw-if-arg-empty';
import { ColumnBase } from '../core/core';

export class ActionParam {
  constructor(
    public types: Set<string>,
  ) {
    throwIfFalsy(types, 'types');
  }
}

export default function param(types: Set<string>|ColumnBase): ActionParam {
  if (types instanceof ColumnBase) {
    return new ActionParam((types as ColumnBase).__getTargetColumn().types)
  }
  return new ActionParam(types as Set<string>);
}
