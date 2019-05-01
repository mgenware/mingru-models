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
      type = `[${(typeObject as Column).__name}]`;
    }
    return `${this.name}: ${type}`;
  }

  isEqualTo(oth: SQLInput): boolean {
    if (!oth) {
      return false;
    }
    if (this.name !== oth.name) {
      return false;
    }
    if (typeof this.typeObject !== typeof oth.typeObject) {
      return false;
    }
    if (typeof this.typeObject === 'string') {
      return (this.typeObject as string) === (oth.typeObject as string);
    }
    return (this.typeObject as Column) === (oth.typeObject as Column);
  }
}

export function input(type: string | Column, name?: string): SQLInput {
  if (type instanceof Column) {
    const col = type as Column;
    if (!name) {
      name = col.inputName();
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
export type SQLConvertible = string | Column | SQLInput | SQL | SQLCall;

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

export class SQLInputList {
  list: SQLInput[] = [];
  map: { [name: string]: SQLInput } = {};

  get length(): number {
    return this.list.length;
  }

  getByIndex(index: number): SQLInput | null {
    return this.list[index];
  }

  getByName(name: string): SQLInput | null {
    return this.map[name];
  }

  add(val: SQLInput) {
    throwIfFalsy(val, 'val');
    const prev = this.getByName(val.name);
    if (prev) {
      if (!prev.isEqualTo(val)) {
        throw new Error(
          `Two inputs with same name "${val.name}" but different types`,
        );
      }
    } else {
      this.list.push(val);
      this.map[val.name] = val;
    }
  }
}

export class SQL {
  elements: SQLElement[] = [];
  inputs = new SQLInputList();

  constructor(literals: TemplateStringsArray, params: SQLConvertible[]) {
    for (let i = 0; i < params.length; i++) {
      // Skip empty strings
      if (literals[i]) {
        this.pushElement(new SQLElement(SQLElementType.rawString, literals[i]));
      }
      const param = params[i];
      if (typeof param === 'string') {
        this.pushElement(
          new SQLElement(SQLElementType.rawString, param as string),
        );
      } else if (param instanceof Column) {
        this.pushElement(new SQLElement(SQLElementType.column, param));
      } else if (param instanceof SQLInput) {
        this.pushElement(new SQLElement(SQLElementType.input, param));
      } else if (param instanceof SQL) {
        for (const element of (param as SQL).elements) {
          this.pushElement(element);
        }
      } else if (param instanceof SQLCall) {
        this.pushElement(new SQLElement(SQLElementType.call, param));
      } else {
        throw new Error(
          `Unsupported SQL parameter type "${toTypeString(param)}"`,
        );
      }
    }

    // push the last literal
    const lastLiteral = literals[literals.length - 1];
    if (lastLiteral) {
      this.pushElement(new SQLElement(SQLElementType.rawString, lastLiteral));
    }
  }

  toString(): string {
    return this.elements.map(e => this.formatElement(e)).join('');
  }

  findColumn(): Column | null {
    for (const element of this.elements) {
      if (element.type === SQLElementType.column) {
        return element.toColumn();
      }
      if (element.type === SQLElementType.call) {
        const call = element.toCall();
        for (const arg of call.params) {
          const col = arg.findColumn();
          if (col) {
            return col;
          }
        }
      }
    }
    return null;
  }

  private pushElement(element: SQLElement) {
    if (element.type === SQLElementType.input) {
      this.inputs.add(element.value as SQLInput);
    }
    this.elements.push(element);
  }

  private formatElement(element: SQLElement): string {
    switch (element.type) {
      case SQLElementType.rawString: {
        return element.toRawString();
      }
      case SQLElementType.column: {
        return '`' + element.toColumn().__name + '`';
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
  ...params: SQLConvertible[]
): SQL {
  return new SQL(literals, params);
}

export function convertToSQL(element: SQLConvertible): SQL {
  if (element instanceof SQL) {
    return element as SQL;
  }
  return sql`${element}`;
}
