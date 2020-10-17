import { throwIfFalsy } from 'throw-if-arg-empty';
import toTypeString from 'to-type-string';
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
  constructor(
    public elements: SQLElement[],
    // True if this expression contains columns or inputs
    public hasColumns: boolean,
    // True if this expression contains SQLCalls
    public hasCalls: boolean,
  ) {}

  toString(): string {
    return `SQL(${this.elements.map((e) => e.toString()).join(', ')})`;
  }

  // If the callback returns true, it stops.
  enumerateColumns(cb: (col: Column) => boolean): boolean {
    for (const element of this.elements) {
      if (element.type === SQLElementType.column) {
        if (cb(element.toColumn())) {
          return true;
        }
      } else if (element.type === SQLElementType.call) {
        const call = element.toCall();
        for (const argExpr of call.params) {
          if (argExpr.enumerateColumns(cb)) {
            return true;
          }
        }
      } else if (element.type === SQLElementType.rawColumn) {
        const rawCol = element.toRawColumn();
        if (rawCol.core instanceof SQL) {
          if (rawCol.core.enumerateColumns(cb)) {
            return true;
          }
        } else if (cb(rawCol.core)) {
          return true;
        }
      }
    }
    return false;
  }

  findFirstColumn(): Column | null {
    let col: Column | null = null;
    this.enumerateColumns((innerCol) => {
      col = innerCol;
      return true;
    });
    return col;
  }

  sniffType(): ColumnType | null {
    for (const element of this.elements) {
      const { type } = element;
      if (type === SQLElementType.column) {
        return element.toColumn().__type;
      }
      if (type === SQLElementType.call) {
        const call = element.toCall();
        const { returnType } = call;
        if (returnType instanceof ColumnType) {
          return returnType;
        }
        // `returnType` is the index of the specified param that indicates the return type.
        const param = call.params[returnType];
        if (!param) {
          throw new Error(`Unexpected empty param from return type index ${returnType}`);
        }
        if (param instanceof Column) {
          return param.__type;
        }
        if (param instanceof SQL) {
          return param.sniffType();
        }
        throw new Error(
          `Return type index must point to a column-like value, got a "${toTypeString(
            param,
          )}" at index ${returnType}`,
        );
      }
      if (type === SQLElementType.rawColumn) {
        const raw = element.toRawColumn();
        if (raw.type) {
          return raw.type;
        }
        if (raw.core instanceof Column) {
          return raw.core.__type;
        }
      }
    }
    return null;
  }
}
