import { Column } from './core';
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
      desc = type as string;
    } else {
      desc = `[${(type as Column).__name}]`;
    }
    return `${this.name}: ${desc}`;
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
      case SQLElementType.rawColumn: {
        return `RAW(${element.toRawColumn().toString()})`;
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
