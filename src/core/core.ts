import { throwIfFalsy } from 'throw-if-arg-empty';
import utils from '../lib/utils';
import toTypeString from 'to-type-string';

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
    const copied = Column._spawn(
      mirroredColumn,
      table,
      mirroredColumn.props.name,
    );
    copied.props.mirroredColumn = mirroredColumn;
    return copied;
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
    this.checkMutability();
    this.props.nullable = true;
    return this;
  }

  get unique(): Column {
    this.checkMutability();
    this.props.unique = true;
    return this;
  }

  freeze() {
    Object.freeze(this.props);
    Object.freeze(this);
  }

  setDefault(value: unknown): this {
    this.checkMutability();
    this.props.default = value;
    return this;
  }

  setName(name: string): this {
    throwIfFalsy(name, 'name');
    this.checkMutability();
    this.props.name = name;
    return this;
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
        return Column.spawnJoinedColumn(selectedColumn, joinedTable);
      },
    });
  }

  private checkMutability() {
    if (Object.isFrozen(this)) {
      throw new Error(
        `The current column "${this.props.name}" of type ${toTypeString(
          this,
        )} cannot be modified, it is frozen. It is mostly likely because you are modifying a column from another table`,
      );
    }
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

// Generates a column name for a join, we call it a middle and we need to cut the ending `_id`, e.g. `SELECT post.user_id.join(user).name`, the `user_id` before the join is the middle name, the input name for this column is `postUserName`, note the `_id` of `user_id` is removed.
function makeMiddleName(s: string): string {
  if (!s) {
    throw new Error(`Unexpected empty value in "makeMiddleName"`);
  }
  return utils.capitalizeColumnName(
    utils.toCamelCase(utils.stripTrailingSnakeID(s)),
  );
}
