import { Column } from './core';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { SQLCall } from './sqlCall';
import toTypeString from 'to-type-string';

export class SQLInput {
  constructor(public typeObject: string | Column, public name: string) {
    throwIfFalsy(typeObject, 'typeObject');
    throwIfFalsy(name, 'name');
  }

  toString(): string {
    const { typeObject } = this;
    let type = '';
    if (typeof typeObject === 'string') {
      type = typeObject as string;
    } else {
      type = `[${(typeObject as Column).props.name}]`;
    }
    return `${this.name}: ${type}`;
  }
}

export function input(type: string | Column, name?: string): SQLInput {
  if (type instanceof Column) {
    const col = type as Column;
    if (!name) {
      name = col.props.inputName();
      if (!name) {
        throw new Error(
          `Unexpected empty input name for column "${toTypeString(type)}"`,
        );
      }
    }
    return new SQLInput(col, name);
  }
  if (!name) {
    throw new Error(`Unexpected empty input name for type "${type}"`);
  }
  return new SQLInput(type as string, name as string);
}

// Allowed types in dd.sql template strings
export type SQLParam = string | Column | SQLInput | SQL | SQLCall;

export enum SQLElementType {
  rawString,
  column,
  input,
  call,
}

export class SQLElement {
  constructor(public type: SQLElementType, public value: unknown) {}

  toRawString(): string {
    return this.value as string;
  }

  toColumn(): Column {
    return this.value as Column;
  }

  toInput(): SQLInput {
    return this.value as SQLInput;
  }

  toCall(): SQLCall {
    return this.value as SQLCall;
  }
}

export class SQL {
  elements: SQLElement[];

  constructor(literals: TemplateStringsArray, params: SQLParam[]) {
    const elements: SQLElement[] = [];
    for (let i = 0; i < params.length; i++) {
      // Skip empty strings
      if (literals[i]) {
        elements.push(new SQLElement(SQLElementType.rawString, literals[i]));
      }
      const param = params[i];
      if (typeof param === 'string') {
        elements.push(
          new SQLElement(SQLElementType.rawString, param as string),
        );
      } else if (param instanceof Column) {
        elements.push(new SQLElement(SQLElementType.column, param));
      } else if (param instanceof SQLInput) {
        elements.push(new SQLElement(SQLElementType.input, param));
      } else if (param instanceof SQL) {
        elements.push(...(param as SQL).elements);
      } else if (param instanceof SQLCall) {
        elements.push(new SQLElement(SQLElementType.call, param));
      } else {
        throw new Error(
          `Unsupported SQL parameter type "${toTypeString(param)}"`,
        );
      }
    }

    // push the last literal
    const lastLiteral = literals[literals.length - 1];
    if (lastLiteral) {
      elements.push(new SQLElement(SQLElementType.rawString, lastLiteral));
    }

    this.elements = elements;
  }

  toString(): string {
    return this.elements.map(e => this.formatElement(e)).join('');
  }

  private formatElement(element: SQLElement): string {
    switch (element.type) {
      case SQLElementType.rawString: {
        return element.toRawString();
      }
      case SQLElementType.column: {
        return '`' + element.toColumn().props.name + '`';
      }
      case SQLElementType.input: {
        return `<${element.toInput().toString()}>`;
      }
      case SQLElementType.call: {
        const call = element.toCall();
        const pas = call.params.length
          ? call.params.map(p => `, ${(p as object).toString()}`).join('')
          : '';
        return `CALL(${call.type}${pas})`;
      }
      default: {
        throw new Error(
          `Unsupported SQL element type "${toTypeString(element)}"`,
        );
      }
    }
  }
}

export function sql(
  literals: TemplateStringsArray,
  ...params: SQLParam[]
): SQL {
  return new SQL(literals, params);
}
