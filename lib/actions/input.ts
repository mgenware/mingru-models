import { throwIfFalsy } from 'throw-if-arg-empty';
import { ColumnBase } from '../core/core';

export class InputParam {
  constructor(
    public types: Set<string>,
  ) {
    throwIfFalsy(types, 'types');
  }

  equalTo(oth: InputParam): boolean {
    if (this === oth) {
      return true;
    }
    return this.setEquals(this.types, oth.types);
  }

  private setEquals(a: Set<string>, b: Set<string>) {
    if (a.size !== b.size) {
      return false;
    }
    for (const item of a) {
      if (!b.has(item)) {
        return false;
      }
    }
    return true;
  }
}

export default function input(types: Set<string>|ColumnBase): InputParam {
  if (types instanceof ColumnBase) {
    return new InputParam((types as ColumnBase).__getTargetColumn().types);
  }
  return new InputParam(types as Set<string>);
}
