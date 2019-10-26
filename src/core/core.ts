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

  toString(): string {
    return `ColType(${this.types.join(', ')})`;
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

  // If null, this property is not initialized.
  __name: string | null = null;
  __payload!: unknown;
}

export enum JoinType {
  inner,
  left,
  right,
  full,
}

export class Column extends CoreProperty {
  static fromTypes(types: string | string[]): Column {
    types = typeof types === 'string' ? [types] : types;
    return new Column(new ColumnType(types));
  }

  static newForeignColumn(
    srcColumn: Column,
    table: Table | null, // can be null, used by mm.fk which doesn't have a table param
  ): Column {
    throwIfFalsy(srcColumn, 'srcColumn');

    const copied = Column.copyFrom(srcColumn, table, null);
    copied.foreignColumn = srcColumn;
    // For foreign column, `__name` is reset to null
    copied.__name = null;
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
    res.type.autoIncrement = false;
    return res;
  }

  type: ColumnType;
  defaultValue: unknown;
  isNoDefaultOnCSQL = false;

  __dbName: string | null = null;
  __table: Table | JoinedTable | null = null;
  __inputName: string | null = null;

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

  get autoIncrement(): Column {
    this.checkMutability();
    this.type.autoIncrement = true;
    return this;
  }

  get noAutoIncrement(): Column {
    this.checkMutability();
    this.type.autoIncrement = false;
    return this;
  }

  get noDefaultOnCSQL(): Column {
    this.checkMutability();
    this.isNoDefaultOnCSQL = true;
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

  setInputName(name: string): this {
    throwIfFalsy(name, 'name');
    this.__inputName = name;
    return this;
  }

  getDBName(): string {
    return this.__dbName || this.__name || '';
  }

  ensureInitialized(): [Table | JoinedTable, string] {
    if (!this.__name || !this.__table) {
      throw new Error(`Column "${this}" is not initialized`);
    }
    return [this.__table, this.__name];
  }

  inputName(): string {
    const [table, name] = this.ensureInitialized();
    if (this.__inputName) {
      return this.__inputName;
    }
    const curName = utils.toCamelCase(name);

    if (table instanceof JoinedTable) {
      if (table.associative) {
        return curName;
      }
      return table.tableInputName() + utils.capitalizeColumnName(curName);
    }
    return curName;
  }

  tableName(dbName: boolean): string {
    const [table] = this.ensureInitialized();
    if (table instanceof Table) {
      return dbName ? table.getDBName() : table.__name;
    }
    // JoinedTable
    return table.tableInputName();
  }

  getSourceTable(): Table | null {
    const table = this.__table;
    if (!table) {
      return null;
    }
    if (table instanceof JoinedTable) {
      return table.srcColumn.getSourceTable();
    }
    return table;
  }

  checkSourceTable(table: Table) {
    if (table !== this.getSourceTable()) {
      throw new Error(
        `Source table assertion failed, expected "${table}", got "${this.getSourceTable()}".`,
      );
    }
  }

  toString(): string {
    let name = this.__name;
    if (this.getDBName() !== name) {
      name += `|${this.getDBName()}`;
    }
    const tableStr = this.__table ? this.__table.toString() : '<null>';
    return `Column(${name}, ${tableStr})`;
  }

  join<T extends Table>(destTable: T, destCol?: Column): T {
    return this.joinCore(JoinType.inner, destTable, destCol, false);
  }

  leftJoin<T extends Table>(destTable: T, destCol?: Column): T {
    return this.joinCore(JoinType.left, destTable, destCol, false);
  }

  rightJoin<T extends Table>(destTable: T, destCol?: Column): T {
    return this.joinCore(JoinType.right, destTable, destCol, false);
  }

  fullJoin<T extends Table>(destTable: T, destCol?: Column): T {
    return this.joinCore(JoinType.full, destTable, destCol, false);
  }

  associativeJoin<T extends Table>(destTable: T, destCol?: Column): T {
    return this.joinCore(JoinType.inner, destTable, destCol, true);
  }

  leftAssociativeJoin<T extends Table>(destTable: T, destCol?: Column): T {
    return this.joinCore(JoinType.left, destTable, destCol, true);
  }

  rightAssociativeJoin<T extends Table>(destTable: T, destCol?: Column): T {
    return this.joinCore(JoinType.right, destTable, destCol, true);
  }

  fullAssociativeJoin<T extends Table>(destTable: T, destCol?: Column): T {
    return this.joinCore(JoinType.full, destTable, destCol, true);
  }

  private joinCore<T extends Table>(
    type: JoinType,
    destTable: T,
    destCol: Column | undefined,
    associative: boolean,
  ): T {
    throwIfFalsy(destTable, 'destTable');
    // source column + dest table + dest column = joined table

    // Try using dest table's PK if destCol is not present
    if (!destCol && destTable.__pks.length) {
      destCol = destTable.__pks[0];
    }
    if (!destCol) {
      throw new Error(
        `Cannot infer target column, please explicitly pass the "destCol" parameter`,
      );
    }

    // Join returns a proxy, each property access first retrieves the original column from original joined table, then it constructs a new copied column with `props.table` set to a newly created JoinedTable
    const joinedTable = new JoinedTable(
      this,
      destTable,
      destCol,
      type,
      associative,
    );
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

  toString(): string {
    let name = this.__name;
    if (name !== this.getDBName()) {
      name += `|${this.getDBName()}`;
    }
    return `Table(${name})`;
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
    public type: JoinType,
    public associative: boolean, // If srcColumn is associative
  ) {
    let localPath: string;
    const [srcTable] = srcColumn.ensureInitialized();
    if (srcTable instanceof JoinedTable) {
      // source column is a joined column
      const srcTableKeyPath = srcTable.keyPath;
      localPath = `[${srcTableKeyPath}.${srcColumn.__name}]`;
    } else {
      localPath = `[${srcTable.__name}.${srcColumn.__name}]`;
    }

    const remotePath = `[${destColumn.tableName(true)}.${destColumn.__name}]`;
    this.keyPath = `[${localPath}.${remotePath}]`;
  }

  tableInputName(): string {
    const { srcColumn } = this;
    const [srcTable, srcName] = srcColumn.ensureInitialized();
    const curName = makeMiddleName(srcName);
    if (srcTable instanceof JoinedTable) {
      if (srcTable.associative) {
        return curName;
      }
      // If srcColumn is a joined column, e.g. cmt.post_id.join(post).user_id.join(user), returns 'postUser' in this case.
      return srcTable.tableInputName() + utils.capitalizeFirstLetter(curName);
    }
    // If srcColumn is not a joined column, omit the table name, e.g. post.user_id.join(user), returns "user".
    return curName;
  }

  toString(): string {
    return `JoinedTable(${this.keyPath})`;
  }
}

// Generates a column name for a join, we call it a middle and we need to cut the trailing `_id`, e.g. `SELECT post.user_id.join(user).name`, the `user_id` before the join is the middle name, the input name for this column is `userName`.
function makeMiddleName(s: string): string {
  if (!s) {
    throw new Error(`Unexpected empty value in "makeMiddleName"`);
  }
  return utils.toCamelCase(utils.stripTrailingSnakeID(s));
}
