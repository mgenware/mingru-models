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

  loadTemplateString(literals: TemplateStringsArray, elements: SQLConvertible[]) {
    for (let i = 0; i < elements.length; i++) {
      // Skip empty strings
      if (literals[i]) {
        this.pushElement(new SQLElement(SQLElementType.rawString, literals[i]));
      }
      const el = elements[i];
      if (el !== undefined) {
        this.push(el);
      }
    }

    // push the last literal
    const lastLiteral = literals[literals.length - 1];
    if (lastLiteral) {
      this.pushElement(new SQLElement(SQLElementType.rawString, lastLiteral));
    }
  }

  push(el: SQLConvertible) {
    if (el === null) {
      this.pushElement(new SQLElement(SQLElementType.rawString, constants.NULL));
    } else if (typeof el === 'string') {
      this.pushElement(new SQLElement(SQLElementType.rawString, el));
    } else if (el instanceof Column) {
      this.pushElement(new SQLElement(SQLElementType.column, el));
    } else if (el instanceof SQLVariable) {
      this.pushElement(new SQLElement(SQLElementType.param, el));
    } else if (el instanceof SQL) {
      for (const element of el.elements) {
        this.pushElement(element);
      }
    } else if (el instanceof SQLCall) {
      this.pushElement(new SQLElement(SQLElementType.call, el));
    } else if (el instanceof SelectedColumn) {
      this.pushElement(new SQLElement(SQLElementType.rawColumn, el));
    } else if (el instanceof Action) {
      this.pushElement(new SQLElement(SQLElementType.action, el));
    } else {
      throw new Error(`Unsupported SQL parameter type "${el}"`);
    }
  }

  pushWithSpace(el: SQLConvertible) {
    if (this.elements.length) {
      this.push(' ');
    }
    this.push(el);
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
