import SQLConvertible from './sqlConvertible.js';
import {
  Column,
  ColumnType,
  SelectedColumn,
  SQL,
  SQLElement,
  SQLElementType,
  SQLVariable,
  SQLVariableType,
  SQLCall,
  SQLCallType,
} from './core.js';
import { Action } from '../actions/actionGroup.js';
import * as constants from '../constants.js';

export class SQLBuilder {
  elements: SQLElement[] = [];

  loadTemplateString(literals: TemplateStringsArray, params: SQLConvertible[]) {
    for (let i = 0; i < params.length; i++) {
      // Skip empty strings
      if (literals[i]) {
        this.pushElement(new SQLElement(SQLElementType.rawString, literals[i]));
      }
      const param = params[i];
      if (param !== undefined) {
        this.push(param);
      }
    }

    // push the last literal
    const lastLiteral = literals[literals.length - 1];
    if (lastLiteral) {
      this.pushElement(new SQLElement(SQLElementType.rawString, lastLiteral));
    }
  }

  push(param: SQLConvertible) {
    if (param === null) {
      this.pushElement(new SQLElement(SQLElementType.rawString, constants.NULL));
    } else if (typeof param === 'string') {
      this.pushElement(new SQLElement(SQLElementType.rawString, param));
    } else if (param instanceof Column) {
      this.pushElement(new SQLElement(SQLElementType.column, param));
    } else if (param instanceof SQLVariable) {
      this.pushElement(new SQLElement(SQLElementType.param, param));
    } else if (param instanceof SQL) {
      for (const element of param.elements) {
        this.pushElement(element);
      }
    } else if (param instanceof SQLCall) {
      this.pushElement(new SQLElement(SQLElementType.call, param));
    } else if (param instanceof SelectedColumn) {
      this.pushElement(new SQLElement(SQLElementType.rawColumn, param));
    } else if (param instanceof Action) {
      this.pushElement(new SQLElement(SQLElementType.action, param));
    } else {
      throw new Error(`Unsupported SQL parameter type "${param}"`);
    }
  }

  pushWithSpace(param: SQLConvertible) {
    if (this.elements.length) {
      this.push(' ');
    }
    this.push(param);
  }

  toSQL(): SQL {
    return new SQL(this.elements);
  }

  private pushElement(element: SQLElement) {
    this.elements.push(element);
  }
}

export function sql(literals: TemplateStringsArray, ...params: SQLConvertible[]): SQL {
  const builder = new SQLBuilder();
  builder.loadTemplateString(literals, params);
  return builder.toSQL();
}

export function convertToSQL(element: SQLConvertible): SQL {
  if (element instanceof SQL) {
    return element;
  }
  return sql`${element}`;
}

function getParamTypeName(type: SQLVariableType | Column | ColumnType): string {
  if (type instanceof ColumnType || type instanceof Column) {
    return `${type}`;
  }
  return type.type;
}

export interface ParamAttributes {
  isArray?: boolean;
  column?: Column;
  nullable?: boolean;
}

export function param(
  type: SQLVariableType | Column | ColumnType,
  name?: string,
  attrs?: ParamAttributes,
): SQLVariable {
  // eslint-disable-next-line no-param-reassign
  attrs ??= {};
  let tableColumn = attrs.column;
  if (!tableColumn && type instanceof Column) {
    tableColumn = type;
  }
  if (!tableColumn && !name) {
    // Throws when neither column nor name is present.
    throw new Error(`Unexpected empty param name for type \`${getParamTypeName(type)}\``);
  }
  return new SQLVariable(type, name, attrs.isArray || false, tableColumn, attrs.nullable);
}

export function sqlCall(
  type: SQLCallType,
  returnType: ColumnType | number,
  params?: SQLConvertible[],
): SQLCall {
  const sqls = params ? params.map((p) => convertToSQL(p)) : [];
  return new SQLCall(type, returnType, sqls);
}
