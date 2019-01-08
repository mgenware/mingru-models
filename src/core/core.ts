import { throwIfFalsy } from 'throw-if-arg-empty';
import utils from '../lib/utils';
import toTypeString from 'to-type-string';
import { SQLCall } from './sqlCall';

export class ColumnProps {
  types = new Set<string>();
  pk = false;
  nullable = false;
  unsigned = false;
  unique = false;
  length = 0;
  default: unknown = undefined;
  name!: string;
  table!: Table | JoinedTable;
  foreignColumn: Column | null = null;

  getInputName(): string {
    return `${utils.toCamelCase(this.tableName())}${utils.capitalizeColumnName(
      utils.toCamelCase(this.name),
    )}`;
  }

  tableName(): string {
    const { table } = this;
    if (table instanceof Table) {
      return this.castToTable().__name;
    }
    // JoinedTable
    return this.castToJoinedTable().name();
  }

  isJoinedColumn(): boolean {
    return this.table instanceof JoinedTable;
  }

  castToTable(): Table {
    return this.table as Table;
  }

  castToJoinedTable(): JoinedTable {
    return this.table as JoinedTable;
  }
}

export class Column {
  static fromTypes(types: string[] | string): Column {
    throwIfFalsy(types, 'types');

    const res = new Column();
    const { props } = res;
    if (Array.isArray(types)) {
      for (const t of types) {
        props.types.add(t);
      }
    } else {
      props.types.add(types as string);
    }
    return res;
  }

  static fromColumn(column: Column): Column {
    throwIfFalsy(column, 'column');

    const res = new Column();
    res.props = new ColumnProps();
    Object.assign(res.props, column.props);
    const { props } = res;
    // Deep copy values
    props.types = new Set<string>(column.props.types);
    return res;
  }

  props = new ColumnProps();

  get nullable(): Column {
    this.props.nullable = true;
    return this;
  }

  get unique(): Column {
    this.props.unique = true;
    return this;
  }

  setDefault(value: unknown): this {
    this.props.default = value;
    return this;
  }

  setName(name: string): this {
    throwIfFalsy(name, 'name');
    this.props.name = name;
    return this;
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

  inputName(): string {
    const { props } = this;
    if (props.table instanceof Table) {
      return `${utils.toCamelCase(
        props.tableName(),
      )}${utils.capitalizeColumnName(utils.toCamelCase(props.name))}`;
    }
    // JoinedTable
    const curName = makeMiddleName(props.name);
    return (props.table as JoinedTable).name() + curName;
  }

  join<T extends Table>(destTable: T): T {
    const localColumn = this;
    // source column + dest table + dest column = joined table
    // Simple case: post.user_id.join(user): since post.user_id is a FK to user.id, so dest column here is implicitly user.id

    // Complex case: cmt.post_id.join(post).user_id.join(user): the current object(`this`) is a joined column(`cmt.post_id.join(post).user_id`), and also a FK.
    const { props } = this;
    if (!props.foreignColumn) {
      throw new Error(
        `You cannot call "join" on this column of type "${toTypeString(
          this,
        )}", because it's not a foreign column`,
      );
    }
    // `this` is FK here
    const destColumn = props.foreignColumn;

    // Join returns a proxy, each property access first retrieves the original column from original joined table, then it constructs a new copied column with `props.table` set to a newly created JoinedTable
    const joinedTable = new JoinedTable(this, destTable, destColumn);
    return new Proxy<T>(destTable, {
      get(target, propKey, receiver) {
        const selectedColumn = Reflect.get(target, propKey, receiver) as Column;
        // returns a joined column
        const jc = Column.fromColumn(selectedColumn);
        jc.props.table = joinedTable;
        // joined column is also a foreign column, it references the selected column
        jc.props.foreignColumn = selectedColumn;
        return jc;
      },
    });
  }
}

export class Table {
  __columns: Column[];
  __name!: string;
  __pks: Column[] = [];

  constructor(name?: string) {
    this.__columns = [];
    if (name) {
      this.__name = name;
    }
  }
}

export class JoinedTable {
  // keyPath is useful to detect duplicate joins, if multiple JoinedTable instances are created with same columns and tables, they'd have same `keyPath`s.
  keyPath: string;

  constructor(
    public srcColumn: Column,
    public destTable: Table,
    public destColumn: Column,
  ) {
    const { props } = srcColumn;

    let localPath: string;
    if (props.isJoinedColumn()) {
      // source column is a joined column
      const srcTableKeyPath = props.castToJoinedTable().keyPath;
      localPath = `[${srcTableKeyPath}.${props.name}]`;
    } else {
      localPath = `[${props.castToTable().__name}.${props.name}]`;
    }

    const remotePath = `[${destColumn.props.tableName()}.${
      destColumn.props.name
    }]`;
    this.keyPath = `[${localPath}.${remotePath}]`;
  }

  name(): string {
    const { srcColumn } = this;
    // e.g. (post).user_id.join(user), returns "postUser"
    return (
      utils.toCamelCase(srcColumn.props.tableName()) +
      makeMiddleName(srcColumn.props.name)
    );
  }
}

export class JoinedColumn {
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
export type SQLParam = string | ColumnBase | SQLInput | SQL | SQLCall;

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
      if (typeof param === 'string') {
        elements.push(
          new SQLElement(SQLElementType.rawString, param as string),
        );
      } else if (param instanceof ColumnBase) {
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
          s += `CALL(${element.toCall().type})`;
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

// Generates a column name for a join, we call it a middle and we need to cut the ending `_id`, e.g. `SELECT post.user_id.join(user).name`, the `user_id` before the join is the middle name, the input name for this column is `postUserName`, note the `_id` of `user_id` is removed.
function makeMiddleName(s: string): string {
  return utils.capitalizeColumnName(
    utils.toCamelCase(utils.stripTrailingSnakeID(s)),
  );
}
