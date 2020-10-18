import { throwIfFalsy } from 'throw-if-arg-empty';
import { Column, ColumnType } from './core';

export interface SQLVariableType {
  name: string;
  defaultValue: unknown;
  module?: string;
  importPath?: string;
}

export class SQLVariable {
  isArray: boolean;

  constructor(
    public type: SQLVariableType | Column | ColumnType,
    public name?: string,
    isArray?: boolean,
    public column?: Column | undefined,
  ) {
    throwIfFalsy(type, 'type');
    this.isArray = isArray || false;
  }

  toString(): string {
    const { type } = this;
    let desc = '';
    if (typeof type === 'string') {
      desc = `String(${type})`;
    } else if (type instanceof Column || type instanceof ColumnType) {
      desc = type.toString();
    } else {
      desc = JSON.stringify(type);
    }
    return `SQLVar(${this.name}, desc = ${desc})`;
  }
}

export enum SQLElementType {
  rawString,
  column,
  input,
  call,
  rawColumn,
  action,
}

export class SQLElement {
  constructor(public type: SQLElementType, public value: unknown) {}

  toString(): string {
    return `E(${this.value}, type = ${this.type})`;
  }
}

export class SQL {
  constructor(public elements: SQLElement[]) {}

  toString(): string {
    return `SQL(${this.elements.map((e) => e.toString()).join(', ')})`;
  }
}
