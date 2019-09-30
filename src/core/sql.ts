import { Column, ColumnType } from './core';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { SQLCall } from './sqlCall';
import toTypeString from 'to-type-string';
import { RawColumn } from '../actions/selectAction';

export class SQLVariable {
  constructor(
    public type: string | Column, // type string can also contains an import path: <Type name>[|<Import>]
    public name: string,
  ) {
    throwIfFalsy(type, 'type');
    throwIfFalsy(name, 'name');
  }

  toString(): string {
    const { type } = this;
    let desc = '';
    if (typeof type === 'string') {
      desc = `String(${type})`;
    } else {
      // type is Column
      desc = type.toString();
    }
    return `SQLVar(${this.name}, desc = ${desc})`;
  }

  isEqualTo(oth: SQLVariable): boolean {
    if (!oth) {
      return false;
    }
    if (this.name !== oth.name) {
      return false;
    }
    if (typeof this.type !== typeof oth.type) {
      return false;
    }
    if (typeof this.type === 'string') {
      return (this.type as string) === (oth.type as string);
    }
    return (this.type as Column) === (oth.type as Column);
  }
}

export function input(type: string | Column, name?: string): SQLVariable {
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
    return new SQLVariable(col, name);
  }
  if (!name) {
    throw new Error(`Unexpected empty input name for type "${type}"`);
  }
  return new SQLVariable(type as string, name as string);
}

// Allowed types in dd.sql template strings
export type SQLConvertible =
  | string
  | Column
  | SQLVariable
  | SQL
  | SQLCall
  | RawColumn;

export enum SQLElementType {
  rawString,
  column,
  input,
  call,
  rawColumn,
}

export class SQLElement {
  constructor(public type: SQLElementType, public value: unknown) {}

  toRawString(): string {
    return this.value as string;
  }

  toColumn(): Column {
    return this.value as Column;
  }

  toRawColumn(): RawColumn {
    return this.value as RawColumn;
  }

  toInput(): SQLVariable {
    return this.value as SQLVariable;
  }

  toCall(): SQLCall {
    return this.value as SQLCall;
  }

  toString(): string {
    return `E(${(this.value as object).toString()}, type = ${this.type})`;
  }
}

export class SQL {
  elements: SQLElement[] = [];
  // True if this expression contains columns or inputs
  hasColumns = false;
  // True if this expression contains SQLCalls
  hasCalls = false;

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
      } else if (param instanceof SQLVariable) {
        this.pushElement(new SQLElement(SQLElementType.input, param));
      } else if (param instanceof SQL) {
        for (const element of (param as SQL).elements) {
          this.pushElement(element);
        }
      } else if (param instanceof SQLCall) {
        this.pushElement(new SQLElement(SQLElementType.call, param));
      } else if (param instanceof RawColumn) {
        this.pushElement(new SQLElement(SQLElementType.rawColumn, param));
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
    return `SQL(${this.elements.map(e => e.toString()).join(', ')})`;
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

  sniffType(): ColumnType | string | null {
    for (const element of this.elements) {
      const { type } = element;
      if (type === SQLElementType.column) {
        return element.toColumn().type;
      }
      if (type === SQLElementType.call) {
        return element.toCall().returnType;
      }
      if (type === SQLElementType.rawColumn) {
        const raw = element.toRawColumn();
        if (raw.type) {
          return raw.type;
        }
        if (raw.core instanceof Column) {
          return raw.core.type;
        }
      }
    }
    return null;
  }

  private pushElement(element: SQLElement) {
    if (
      element.type === SQLElementType.column ||
      element.type === SQLElementType.input
    ) {
      this.hasColumns = true;
    } else if (element.type === SQLElementType.call) {
      this.hasCalls = true;
    }
    this.elements.push(element);
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
