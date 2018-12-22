import { throwIfFalsy } from 'throw-if-arg-empty';
import utils from '../lib/utils';
import toTypeString from 'to-type-string';
import { SQLCall } from './sqlCall';

const InternalPropPrefix = '__';

export enum ColumnBaseType {
  Full, // Column
  Foreign, // ForeignColumn
  Joined, // JoinedColumn
  Selected, // SelectedColumn
}

/** Core types */
export class ColumnBase {
  __table!: Table;
  __name!: string;
  __type: ColumnBaseType;

  constructor(type: ColumnBaseType) {
    this.__type = type;
  }

  __getTargetColumn(): Column {
    throw new Error('Not implemented yet');
  }

  __getInputName(): string {
    return `${utils.toCamelCase(this.tableName)}${utils.capitalizeColumnName(
      utils.toCamelCase(this.__name),
    )}`;
  }

  get tableName(): string {
    return this.__table.__name;
  }

  join<T extends Table>(remoteTable: T, remoteColumn?: ColumnBase): T {
    const localColumn = this;
    let rc: ColumnBase;
    if (remoteColumn) {
      if (remoteColumn.__table !== remoteTable) {
        throw new Error(
          `The remote column "${remoteColumn}" does not belong to the remote table "${remoteTable}"`,
        );
      }
      rc = remoteColumn;
    } else {
      // See README.md (JoinedColumn for details)
      if (this instanceof JoinedColumn) {
        rc = this.remoteColFromFCOrThrow(
          ((this as unknown) as JoinedColumn).selectedColumn,
        );
      } else {
        rc = this.remoteColFromFCOrThrow();
      }
    }
    return new Proxy<T>(remoteTable, {
      get(target, propKey, receiver) {
        const targetColumn = Reflect.get(target, propKey, receiver) as Column;
        let localPath: string;
        if (localColumn instanceof JoinedColumn) {
          const colPath = ((localColumn as unknown) as JoinedColumn).joinPath;
          localPath = `[${colPath}.${localColumn.__name}]`;
        } else {
          localPath = `[${localColumn.__table.__name}.${localColumn.__name}]`;
        }
        const remotePath = `[${rc.__table.__name}.${rc.__name}]`;
        const path = `[${localPath}.${remotePath}]`;
        return new JoinedColumn(path, localColumn, rc, targetColumn);
      },
    });
  }

  as(name: string): SelectedColumn {
    throwIfFalsy(name, 'name');
    return new SelectedColumn(this, name);
  }

  toInput(name?: string): SQLInput {
    return input(this, name);
  }

  toInputSQL(name?: string): SQL {
    return sql`${this.toInput(name)}`;
  }

  isEqualTo(valueSQL: SQL): SQL {
    return sql`${this} = ${valueSQL}`;
  }

  isEqualToInput(name?: string): SQL {
    return this.isEqualTo(sql`${this.toInput(name)}`);
  }

  isNotEqualTo(valueSQL: SQL): SQL {
    return sql`${this} <> ${valueSQL}`;
  }

  isNotEqualToInput(name?: string): SQL {
    return this.isNotEqualTo(sql`${this.toInput(name)}`);
  }

  isNull(): SQL {
    return sql`${this} IS NULL`;
  }

  isNotNull(): SQL {
    return sql`${this} IS NOT NULL`;
  }

  private remoteColFromFCOrThrow(col?: ColumnBase): ColumnBase {
    col = col || this;
    if (col instanceof ForeignColumn) {
      return ((col as unknown) as ForeignColumn).ref;
    }
    throw new Error(
      `Local column "${col}" is not a foreign column, you have to specify the "remoteColumn" argument`,
    );
  }
}

export class ForeignColumn extends ColumnBase {
  constructor(name: string, tbl: Table, public ref: ColumnBase) {
    super(ColumnBaseType.Foreign);
    throwIfFalsy(ref, 'ref');
    this.__name = name;
    this.__table = tbl;
  }

  __getTargetColumn(): Column {
    return this.ref.__getTargetColumn();
  }
}

export class ColumnProps {
  pk = false;
  nullable = false;
  unsigned = false;
  unique = false;
  length = 0;
  default: unknown = undefined;
}

export class Column extends ColumnBase {
  __userName = '';
  types = new Set<string>();
  props = new ColumnProps();

  constructor(types: string[] | string) {
    super(ColumnBaseType.Full);
    throwIfFalsy(types, 'types');

    if (Array.isArray(types)) {
      for (const t of types) {
        this.types.add(t);
      }
    } else {
      this.types.add(types as string);
    }
  }

  get nullable(): Column {
    this.props.nullable = true;
    return this;
  }

  get unique(): Column {
    this.props.unique = true;
    return this;
  }

  __getTargetColumn(): Column {
    return this;
  }
}

export class Table {
  __columns: ColumnBase[];
  __name!: string;
  __pks: Column[] = [];

  constructor(name?: string) {
    this.__columns = [];
    if (name) {
      this.__name = name;
    }
  }
}

export function table<T extends Table>(
  cls: new (name?: string) => T,
  name?: string,
): T {
  throwIfFalsy(cls, 'cls');
  const tableObj = new cls(name);
  const className = tableObj.constructor.name;
  // table.__name can be in ctor
  if (!tableObj.__name) {
    tableObj.__name = utils.toSnakeCase(className);
  }
  const cols = tableObj.__columns;
  for (const pair of Object.entries(tableObj)) {
    const colName = pair[0] as string;
    // Ignore internal props
    if (colName.startsWith(InternalPropPrefix)) {
      continue;
    }
    const col = pair[1] as ColumnBase;
    if (!col) {
      throw new Error(`Empty column object at property "${colName}"`);
    }
    if (col instanceof ColumnBase === false) {
      throw new Error(
        `Invalid column at property "${colName}", expected a ColumnBase, got "${toTypeString(
          col,
        )}"`,
      );
    }
    if (col.__type === ColumnBaseType.Joined) {
      throw new Error(
        `Unexpected ${toTypeString(
          col,
        )} at property "${colName}", you should not use JoinedColumn in a table definition, JoinedColumn should be used in SELECT actions`,
      );
    }
    if (col.__type === ColumnBaseType.Selected) {
      throw new Error(
        `Unexpected ${toTypeString(
          col,
        )} at property "${colName}", you should not use SelectedColumn in a table definition, SelectedColumn should be used in SELECT actions`,
      );
    }

    let columnToAdd: ColumnBase;
    if (col.__table) {
      // Foreign column
      const fc = new ForeignColumn(colName, tableObj, col);
      // tslint:disable-next-line
      (tableObj as any)[colName] = fc;
      columnToAdd = fc;
    } else {
      if (!col.__name) {
        // column name can be set by setName
        col.__name = utils.toSnakeCase(colName);
      }
      col.__table = tableObj;
      // Check if it's a pk
      if (col instanceof Column && (col as Column).props.pk) {
        tableObj.__pks.push(col as Column);
      }
      columnToAdd = col;
    }
    Object.freeze(columnToAdd);
    cols.push(columnToAdd);
  }
  return (tableObj as unknown) as T;
}

export class JoinedColumn extends ColumnBase {
  constructor(
    /** Note that joinPath does not include the selected column name. */
    public joinPath: string,
    public localColumn: ColumnBase,
    public remoteColumn: ColumnBase,
    public selectedColumn: ColumnBase,
  ) {
    super(ColumnBaseType.Joined);

    throwIfFalsy(localColumn, 'localColumn');
    throwIfFalsy(remoteColumn, 'remoteColumn');
    throwIfFalsy(selectedColumn, 'selectedColumn');
    // Both __table and __name point to the selected column
    this.__table = selectedColumn.__table;
    this.__name = selectedColumn.__name;
  }

  __getTargetColumn(): Column {
    return this.selectedColumn.__getTargetColumn();
  }

  __getInputName(): string {
    const { localColumn } = this;
    const curName = this.makeMiddleName(this.__name);
    if (localColumn instanceof JoinedColumn) {
      return (localColumn as JoinedColumn).__getInputName() + curName;
    }
    return (
      utils.toCamelCase(localColumn.tableName) +
      this.makeMiddleName(localColumn.__name) +
      curName
    );
  }

  // Generates a column name for a join, we call it a middle and we need to cut the ending `_id`, e.g. `SELECT post.user_id.join(user).name`, the `user_id` before the join is the middle name, the input name for this column is `postUserName`, note the `_id` of `user_id` is removed.
  private makeMiddleName(s: string): string {
    return utils.capitalizeColumnName(
      utils.toCamelCase(utils.stripTrailingSnakeID(s)),
    );
  }
}

export class SelectedColumn extends ColumnBase {
  constructor(public column: ColumnBase, public selectedName: string) {
    super(ColumnBaseType.Selected);

    throwIfFalsy(column, 'column');
    throwIfFalsy(selectedName, 'selectedName');
  }

  __getTargetColumn(): Column {
    return this.column.__getTargetColumn();
  }

  __getInputName(): string {
    return this.selectedName;
  }
}

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
}

export function input(type: string | ColumnBase, name?: string): SQLInput {
  if (type instanceof ColumnBase) {
    const col = type as ColumnBase;
    if (!name) {
      name = col.__getInputName();
      if (!name) {
        throw new Error(
          `Unexpected empty input name for column "${toTypeString(type)}"`,
        );
      }
    }
    return new SQLInput((type as ColumnBase).__getTargetColumn(), name);
  }
  if (!name) {
    throw new Error(`Unexpected empty input name for type "${type}"`);
  }
  return new SQLInput(type as string, name as string);
}

// Allowed types in dd.sql template strings
export type SQLParam = ColumnBase | SQLInput | SQL | SQLCall;

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

  toColumn(): ColumnBase {
    return this.value as ColumnBase;
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
      if (param instanceof ColumnBase) {
        elements.push(new SQLElement(SQLElementType.column, param));
      } else if (param instanceof SQLInput) {
        elements.push(new SQLElement(SQLElementType.input, param));
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
      elements.push(new SQLElement(SQLElementType.rawString, lastLiteral));
    }

    this.elements = elements;
  }

  toString(): string {
    let s = '';
    for (const element of this.elements) {
      switch (element.type) {
        case SQLElementType.rawString: {
          s += element.toRawString();
          break;
        }
        case SQLElementType.column: {
          s += '`' + element.toColumn().__name + '`';
          break;
        }
        case SQLElementType.input: {
          s += `<${element.toInput().toString()}>`;
          break;
        }
        case SQLElementType.call: {
          s += `CALL(${element.toCall()})`;
          break;
        }
        default: {
          throw new Error(
            `Unsupported SQL element type "${toTypeString(element)}"`,
          );
        }
      }
    }
    return s;
  }
}

export function sql(
  literals: TemplateStringsArray,
  ...params: SQLParam[]
): SQL {
  return new SQL(literals, params);
}
