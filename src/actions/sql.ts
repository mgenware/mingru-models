import { InputParam } from './input';
import { ColumnBase } from '../core/core';
import toTypeString from 'to-type-string';

export type SQLParam = ColumnBase | InputParam | SQL;
export type SQLElement = string | ColumnBase | InputParam;

export class SQL {
  elements: SQLElement[];

  constructor(literals: TemplateStringsArray, params: SQLParam[]) {
    const elements: SQLElement[] = [];
    for (let i = 0; i < params.length; i++) {
      // Skip empty strings
      if (literals[i]) {
        elements.push(literals[i]);
      }
      const param = params[i];
      if (param instanceof ColumnBase) {
        elements.push(param as ColumnBase);
      } else if (param instanceof InputParam) {
        elements.push(param as InputParam);
      } else if (param instanceof SQL) {
        elements.push(...(param as SQL).elements);
      } else {
        throw new Error(
          `Unsupported SQL parameter type "${toTypeString(param)}"`,
        );
      }
    }

    // push the last literal
    const lastLiteral = literals[literals.length - 1];
    if (lastLiteral) {
      elements.push(lastLiteral);
    }

    this.elements = elements;
  }
}

export default function sql(
  literals: TemplateStringsArray,
  ...params: SQLParam[]
): SQL {
  return new SQL(literals, params);
}
