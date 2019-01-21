import { throwIfFalsy } from 'throw-if-arg-empty';
import utils from '../lib/utils';
import toTypeString from 'to-type-string';
import { SQLCall } from './sqlCall';

export class ColumnProps {
  pk = false;
  nullable = false;
  unsigned = false;
  unique = false;
  length = 0;
  default: unknown = undefined;
  // Auto set to property name after dd.table()
  name!: string;
  // Auto set to target table after dd.table()
  table!: Table | JoinedTable;
  foreignColumn: Column | null = null;

  // See `Column.join` for details
  mirroredColumn: Column | null = null;

  constructor(public types = new Set<string>()) {}

  inputName(): string {
    if (this.isJoinedColumn()) {
      const curName = makeMiddleName(this.name);
      return this.castToJoinedTable().name() + curName;
    }
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

  static spawnForeignColumn(
    column: Column,
    table: Table | null, // can be nullable, used by dd.fk which doesn't have a table
  ): Column {
    throwIfFalsy(column, 'column');

    // Just to mute tslint
    const tb = table as Table;
    const copied = Column._spawn(column, tb, null);
    copied.props.foreignColumn = column;
    // Unlike spawnJoinedColumn, name will be inherited
    // tslint:disable-next-line no-any
    (copied.props.name as any) = null;
    return copied;
  }

  static spawnJoinedColumn(mirroredColumn: Column, table: JoinedTable): Column {
    return Column._spawn(mirroredColumn, table, mirroredColumn.props.name);
  }

  private static _spawn(
    column: Column,
    table: Table | JoinedTable,
    newName: string | null,
  ): Column {
    const res = new Column();
    res.__props = new ColumnProps();
    Object.assign(res.props, column.props);
    const { props } = res;
    // Deep copy values
    props.types = new Set<string>(column.props.types);
    // Reset values
    props.pk = false;
    props.table = table;
    if (newName) {
      props.name = newName;
    }
    return res;
  }

  __props = new ColumnProps();

  get props(): ColumnProps {
    return this.__props;
  }

  get nullable(): Column {
    this.props.nullable = true;
    return this;
  }

  get unique(): Column {
    this.props.unique = true;
    return this;
  }

  freeze() {
    Object.freeze(this.props);
    Object.freeze(this);
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

  join<T extends Table>(destTable: T): T {
    // source column + dest table + dest column = joined table
    // Simple case: post.user_id.join(user): since post.user_id is a FK to user.id, so dest column here is implicitly user.id

    // Complex case: cmt.post_id.join(post).user_id.join(user): the current object(`this`) is a joined column(`cmt.post_id.join(post).user_id`), and also a FK.
    if (!this.props.foreignColumn) {
      throw new Error(
        `You cannot call "join" on this column of type "${toTypeString(
          this,
        )}", because it's not a foreign column`,
      );
    }
    // `this` is FK here
    const destColumn = this.props.foreignColumn;

    // Join returns a proxy, each property access first retrieves the original column from original joined table, then it constructs a new copied column with `props.table` set to a newly created JoinedTable
    const joinedTable = new JoinedTable(this, destTable, destColumn);
    return new Proxy<T>(destTable, {
      get(target, propKey, receiver) {
        const selectedColumn = Reflect.get(target, propKey, receiver) as
          | Column
          | undefined;

        if (!selectedColumn) {
          throw new Error(
            `The column "${propKey.toString()}" does not exist on table ${toTypeString(
              target,
            )}`,
          );
        }
        // returns a joined column
        const copied = Column.spawnJoinedColumn(selectedColumn, joinedTable);
        const { props } = copied;
        props.mirroredColumn = selectedColumn;
        return copied;
      },
    });
  }

  as(name: string): CalculatedColumn {
    throwIfFalsy(name, 'name');
    return new CalculatedColumn(this, name);
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

/*
 post.user_id.join(user) -> this creates a intermediate joined table

 srcColumn: post.user_id
 destTable: user
 destColumn: user.id
*/
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
      type = `[${(typeObject as Column).props.name}]`;
    }
    return `${this.name}: ${type}`;
  }
}

export function input(type: string | Column, name?: string): SQLInput {
  if (type instanceof Column) {
    const col = type as Column;
    if (!name) {
      name = col.props.inputName();
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
export type SQLParam = string | Column | SQLInput | SQL | SQLCall;

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
      } else if (param instanceof Column) {
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
          s += '`' + element.toColumn().props.name + '`';
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

export class CalculatedColumn {
  constructor(
    public core: Column | SQL,
    public selectedName: string,
    public props?: ColumnProps,
  ) {
    throwIfFalsy(core, 'core');
    throwIfFalsy(selectedName, 'selectedName');
  }
}

// Generates a column name for a join, we call it a middle and we need to cut the ending `_id`, e.g. `SELECT post.user_id.join(user).name`, the `user_id` before the join is the middle name, the input name for this column is `postUserName`, note the `_id` of `user_id` is removed.
function makeMiddleName(s: string): string {
  if (!s) {
    throw new Error(`Unexpected empty value in "makeMiddleName"`);
  }
  return utils.capitalizeColumnName(
    utils.toCamelCase(utils.stripTrailingSnakeID(s)),
  );
}
