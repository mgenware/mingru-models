import { throwIfFalsy } from 'throw-if-arg-empty';
import { ColumnBase } from '../core/core';

export class InputParam {
  constructor(
    public name: string,
    public types: Set<string>,
  ) {
    throwIfFalsy(name, 'name');
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

export default function input(types: Set<string>|ColumnBase, name?: string): InputParam {
  if (types instanceof ColumnBase) {
    if (!name) {
      name = (types as ColumnBase).__getInputName();
    }
    return new InputParam(name, (types as ColumnBase).__getTargetColumn().types);
  }
  // The InputParam.ctor will throw if name is undefined
  return new InputParam(name as string, types as Set<string>);
}
