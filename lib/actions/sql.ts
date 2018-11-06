import { InputParam } from './input';
import { ColumnBase } from '../core/core';

export type SQLParam = ColumnBase | InputParam;

export default class SQL {
  literals: string[];
  params: SQLParam[];

  constructor(
    literals: TemplateStringsArray,
    params: SQLParam[],
  ) {
    if (literals) {
      this.literals = literals.map(s => s);
    } else {
      this.literals = []
    }
    this.params = params || [];
  }

  equalsTo(
    literals: string[],
    params: SQLParam[],
  ): boolean {
    if (this.literals.length !== literals.length) {
      return false;
    }
    if (this.params.length !== params.length) {
      return false;
    }
    for (let i = 0; i < this.literals.length; i++) {
      if (this.literals[i] !== literals[i]) {
        return false;
      }
    }
    for (let i = 0; i < this.params.length; i++) {
      if (!this.paramEquals(this.params[i], params[i])) {
        return false;
      }
    }
    return true;
  }

  private paramEquals(a: SQLParam, b: SQLParam) {
    if (a === b) {
      return true;
    }
    const aInput = a instanceof InputParam;
    const bInput = b instanceof InputParam;
    if (aInput !== bInput) {
      return false;
    }
    if (aInput) {
      return (a as InputParam).equalTo(b as InputParam);
    }
    // a and b are ColumnBase
    return a === b;
  }
}

export function sql(literals: TemplateStringsArray, ...params: SQLParam[]): SQL {
  return new SQL(literals, params);
}
