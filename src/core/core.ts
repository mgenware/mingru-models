import { throwIfFalsy } from 'throw-if-arg-empty';
import utils from '../lib/utils';
import toTypeString from 'to-type-string';

export class ColumnType {
  types: string[];
  pk = false;
  nullable = false;
  unsigned = false;
  unique = false;
  length = 0;
  autoIncrement = false;

  constructor(types: string | string[]) {
    throwIfFalsy(types, 'types');
    types = typeof types === 'string' ? [types] : types;
    this.types = types;
  }
}

export type CorePropertyHandler = () => void;

export class CoreProperty {
  static registerHandler(property: CoreProperty, handler: CorePropertyHandler) {
    throwIfFalsy(property, 'property');
    throwIfFalsy(handler, 'handler');
    if (property.__handlers) {
      property.__handlers.push(handler);
    } else {
      // Call handler immediately if property is already initialized
      handler();
    }
  }

  static wait(property: CoreProperty): Promise<void> {
    return new Promise(resolve => {
      CoreProperty.registerHandler(property, () => resolve());
    });
  }

  static runHandlers(property: CoreProperty) {
    throwIfFalsy(property, 'property');
    if (property.__handlers) {
      for (const handler of property.__handlers) {
        handler();
      }
      // Set handlers to null cuz handlers are meant to be run only once
      property.__handlers = null;
    }
  }

  __handlers: CorePropertyHandler[] | null = [];
  __name!: string;
  __payload!: unknown;
}

export class Column extends CoreProperty {
  static fromTypes(types: string | string[]): Column {
    types = typeof types === 'string' ? [types] : types;
    return new Column(new ColumnType(types));
  }

  static newForeignColumn(
    srcColumn: Column,
    table: Table | null, // can be nullable, used by dd.fk which doesn't have a table param
  ): Column {
    throwIfFalsy(srcColumn, 'srcColumn');

    const copied = Column.copyFrom(srcColumn, table, null);
    copied.foreignColumn = srcColumn;
    // For foreign column, `__name` is reset to null
    // tslint:disable-next-line no-any
    (copied.__name as any) = null;
    return copied;
  }

  static newJoinedColumn(mirroredColumn: Column, table: JoinedTable): Column {
    const copied = Column.copyFrom(
      mirroredColumn,
      table,
      mirroredColumn.__name,
    );
    copied.mirroredColumn = mirroredColumn;
    return copied;
  }

  private static copyFrom(
    column: Column,
    newTable: Table | JoinedTable | null,
    newName: string | null,
  ): Column {
    const res = new Column(column.type);
    // Copy values
    res.defaultValue = column.defaultValue;
    if (newTable) {
      res.__table = newTable;
    }
    if (newName) {
      res.__name = newName;
    }
    res.foreignColumn = column.foreignColumn;
    res.mirroredColumn = column.mirroredColumn;
    // Reset value
    res.type.pk = false;
    return res;
  }

  type: ColumnType;
  defaultValue: unknown = undefined;

  // __ properties will be set after dd.table()
  __dbName: string | null = null;
  __table!: Table | JoinedTable;

  // After v0.14.0, Column.foreignColumn is pretty useless since we allow join any column to any table, the foreignColumn property only indicates a column property is declared as FK and doesn't have any effect on join(), the real dest table and column are determined by join().
  foreignColumn: Column | null = null;

  // See `Column.join` for details
  mirroredColumn: Column | null = null;

  constructor(type: ColumnType) {
    super();

    throwIfFalsy(type, 'type');
    // Copy if frozen
    if (Object.isFrozen(type)) {
      const t = new ColumnType(type.types);
      Object.assign(t, type);
      // Deep copy types
      t.types = [...type.types];
      this.type = t;
    } else {
      this.type = type;
    }
  }

  get nullable(): Column {
    this.checkMutability();
    this.type.nullable = true;
    return this;
  }

  get unique(): Column {
    this.checkMutability();
    this.type.unique = true;
    return this;
  }

  freeze() {
    Object.freeze(this.type);
    Object.freeze(this);
  }

  setDefault(value: unknown): this {
    this.checkMutability();
    this.defaultValue = value;
    return this;
  }

  setDBName(name: string): this {
    throwIfFalsy(name, 'name');
    this.checkMutability();
    this.__dbName = name;
    return this;
  }

  getDBName(): string {
    return this.__dbName || this.__name;
  }

  join<T extends Table>(destTable: T, destCol?: Column): T {
    throwIfFalsy(destTable, 'destTable');
    // source column + dest table + dest column = joined table
    // Simple case: post.user_id.join(user): since post.user_id is a FK to user.id, so dest column here is implicitly user.id

    // Complex case: cmt.post_id.join(post).user_id.join(user): the current object(`this`) is a joined column(`cmt.post_id.join(post).user_id`), and also a FK.

    let destColumn: Column;
    if (destCol) {
      destColumn = destCol;
    } else {
      // No explicit column set, use the PK from destTable
      if (!destTable.__pks.length) {
        throw new Error(`No primary key found on table "${destTable.__name}"`);
      }
      destColumn = destTable.__pks[0];
    }

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
        return Column.newJoinedColumn(selectedColumn, joinedTable);
      },
    });
  }

  inputName(): string {
    const curName = utils.toCamelCase(this.__name);
    if (this.isJoinedColumn()) {
      return (
        this.castToJoinedTable().tableInputName() +
        utils.capitalizeColumnName(curName)
      );
    }
    return curName;
  }

  tableName(dbName = false): string {
    const { __table: table } = this;
    if (table instanceof Table) {
      const t = this.castToTable();
      return dbName ? t.getDBName() : t.__name;
    }
    // JoinedTable
    return this.castToJoinedTable().tableInputName();
  }

  isJoinedColumn(): boolean {
    return this.__table instanceof JoinedTable;
  }

  castToTable(): Table {
    return this.__table as Table;
  }

  castToJoinedTable(): JoinedTable {
    return this.__table as JoinedTable;
  }

  private checkMutability() {
    if (Object.isFrozen(this)) {
      throw new Error(
        `The current column "${this.__name}" of type ${toTypeString(
          this,
        )} cannot be modified, it is frozen. It is mostly likely because you are modifying a column from another table`,
      );
    }
  }
}

export class Table {
  __columns: Column[] = [];
  __name!: string;
  __dbName!: string;
  // Primary key columns
  __pks: Column[] = [];
  // Primary key with auto_increment columns
  __pkAIs: Column[] = [];

  getDBName(): string {
    return this.__dbName || this.__name;
  }
}

/*
 post.user_id.join(user) -> this creates a intermediate joined table

 srcColumn: post.user_id (Column | JoinedColumn)
 destTable: user (Table)
 destColumn: user.id (Column)
*/
export class JoinedTable {
  // keyPath is useful to detect duplicate joins, if multiple JoinedTable instances are created with same columns and tables, they'd have same `keyPath`s.
  keyPath: string;

  constructor(
    public srcColumn: Column,
    public destTable: Table,
    public destColumn: Column,
  ) {
    let localPath: string;
    if (srcColumn.isJoinedColumn()) {
      // source column is a joined column
      const srcTableKeyPath = srcColumn.castToJoinedTable().keyPath;
      localPath = `[${srcTableKeyPath}.${srcColumn.__name}]`;
    } else {
      localPath = `[${srcColumn.castToTable().__name}.${srcColumn.__name}]`;
    }

    const remotePath = `[${destColumn.tableName()}.${destColumn.__name}]`;
    this.keyPath = `[${localPath}.${remotePath}]`;
  }

  tableInputName(): string {
    const { srcColumn } = this;
    const curName = makeMiddleName(srcColumn.__name);
    if (srcColumn.isJoinedColumn()) {
      // If srcColumn is a joined column, e.g. cmt.post_id.join(post).user_id.join(user), returns 'postUser' in this case
      return (
        srcColumn.castToJoinedTable().tableInputName() +
        utils.capitalizeFirstLetter(curName)
      );
    }
    // If srcColumn is not a joined column, omit the table name, e.g. (post).user_id.join(user), returns "user"
    return curName;
  }
}

// Generates a column name for a join, we call it a middle and we need to cut the trailing `_id`, e.g. `SELECT post.user_id.join(user).name`, the `user_id` before the join is the middle name, the input name for this column is `userName`.
function makeMiddleName(s: string): string {
  if (!s) {
    throw new Error(`Unexpected empty value in "makeMiddleName"`);
  }
  return utils.toCamelCase(utils.stripTrailingSnakeID(s));
}
