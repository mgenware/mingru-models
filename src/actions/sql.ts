import { InputParam } from './input';
import { ColumnBase } from '../core/core';

export type SQLParam = ColumnBase | InputParam;
export type SQLElement = string | SQLParam;

export class SQL {
  elements: SQLElement[];

  constructor(literals: TemplateStringsArray, params: SQLParam[]) {
    const elements: SQLElement[] = [];
    for (let i = 0; i < params.length; i++) {
      elements.push(literals[i]);
      elements.push(params[i]);
    }

    // push the last literal
    elements.push(literals[literals.length - 1]);

    this.elements = elements;
  }
}

export default function sql(
  literals: TemplateStringsArray,
  ...params: SQLParam[]
): SQL {
  return new SQL(literals, params);
}
