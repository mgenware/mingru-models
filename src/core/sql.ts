import { throwIfFalsy } from 'throw-if-arg-empty';
import { Column, ColumnType } from './core';

export interface SQLVariableType {
  type: string;
  defaultValue: unknown;
  module?: string;
  importPath?: string;
}

export class SQLVariable {
  readonly isArray: boolean;

  constructor(
    public readonly type: SQLVariableType | Column | ColumnType,
    public readonly name?: string,
    isArray?: boolean,
    public readonly column?: Column | undefined,
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
  constructor(public readonly type: SQLElementType, public readonly value: unknown) {}

  toString(): string {
    const { value } = this;
    return `E(${value !== undefined && value !== null ? `${value}, ` : ''}type = ${this.type})`;
  }
}

export class SQL {
  constructor(public elements: ReadonlyArray<SQLElement>) {}

  toString(): string {
    return `SQL(${this.elements.map((e) => e.toString()).join(', ')})`;
  }
}
