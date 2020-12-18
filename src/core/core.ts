import { throwIfFalsy } from 'throw-if-arg-empty';
import toTypeString from 'to-type-string';
import * as utils from '../lib/utils';

export class ColumnType {
  types: string[];
  pk = false;
  nullable = false;
  unsigned = false;
  unique = false;
  length = 0;
  autoIncrement = false;
  // Used in DECIMAL data type.
  extraLength = 0;

  constructor(types: string | string[]) {
    throwIfFalsy(types, 'types');
    this.types = typeof types === 'string' ? [types] : types;
  }

  toString(): string {
    return `ColType(${this.types.join(', ')})`;
  }
}

export enum JoinType {
  inner,
  left,
  right,
  full,
}

export interface ColumnData {
  name?: string;
  type?: ColumnType;
  defaultValue?: unknown;
  noDefaultValueOnCSQL?: boolean;
  dbName?: string;
  modelName?: string;
  table?: Table | JoinedTable;
  inputName?: string;
  // After v0.14.0, Column.foreignColumn is pretty useless since we allow join any column to any
  // table, the foreignColumn property only indicates a column property is declared as FK and
  // doesn't have any effect on join(), the real dest table and column are determined by join().
  foreignColumn?: Column;
  // See `Column.join` for details
  mirroredColumn?: Column;
}

export class Column {
  static fromTypes(types: string | string[], defaultValue?: unknown): Column {
    const col = new Column(new ColumnType(typeof types === 'string' ? [types] : types));
    col.data.defaultValue = defaultValue;
    return col;
  }

  static newForeignColumn(
    srcColumn: Column,
    table: Table | null, // can be null, used by `mm.fk` which doesn't have a table param.
  ): Column {
    throwIfFalsy(srcColumn, 'srcColumn');

    const copied = Column.copyFrom(srcColumn, table, false);
    copied.data.foreignColumn = srcColumn;
    // For foreign columns, `__name` is reset to null.
    copied.data.name = undefined;
    return copied;
  }

  static newJoinedColumn(mirroredColumn: Column, table: JoinedTable): Column {
    const copied = Column.copyFrom(mirroredColumn, table, true);
    copied.data.mirroredColumn = mirroredColumn;
    return copied;
  }

  private static copyFrom(
    from: Column,
    newTable: Table | JoinedTable | null,
    copyNames: boolean,
  ): Column {
    const to = new Column(from.mustGetType());
    const toData = to.data;
    const fromData = from.data;
    // Copy values
    toData.defaultValue = fromData.defaultValue;
    if (newTable) {
      toData.table = newTable;
    }
    if (copyNames) {
      toData.name = fromData.name;
      toData.modelName = fromData.modelName;
      toData.dbName = fromData.dbName;
    }
    toData.foreignColumn = fromData.foreignColumn;
    toData.mirroredColumn = fromData.mirroredColumn;
    // Reset values.
    to.mustGetType().pk = false;
    to.mustGetType().autoIncrement = false;
    return to;
  }

  protected __data: ColumnData = {};

  private get data(): ColumnData {
    return this.__data;
  }

  private mustGetType(): ColumnType {
    if (!this.data.type) {
      throw new Error('Unexpected empty type');
    }
    return this.data.type;
  }

  constructor(type: ColumnType) {
    throwIfFalsy(type, 'type');
    // Copy if frozen.
    if (Object.isFrozen(type)) {
      const t = new ColumnType(type.types);
      Object.assign(t, type);
      // Deep copy types
      t.types = [...type.types];
      this.data.type = t;
    } else {
      this.data.type = type;
    }
  }

  get nullable(): Column {
    this.checkMutability();
    this.mustGetType().nullable = true;
    return this;
  }

  get unique(): Column {
    this.checkMutability();
    this.mustGetType().unique = true;
    return this;
  }

  get autoIncrement(): Column {
    this.checkMutability();
    this.mustGetType().autoIncrement = true;
    return this;
  }

  get noAutoIncrement(): Column {
    this.checkMutability();
    this.mustGetType().autoIncrement = false;
    return this;
  }

  get noDefaultValueOnCSQL(): Column {
    this.checkMutability();
    this.data.noDefaultValueOnCSQL = true;
    return this;
  }

  __freeze() {
    Object.freeze(this.data);
    Object.freeze(this);
  }

  default(value: unknown): this {
    this.checkMutability();
    this.data.defaultValue = value;
    return this;
  }

  setDBName(name: string): this {
    throwIfFalsy(name, 'name');
    this.checkMutability();
    this.data.dbName = name;
    return this;
  }

  setModelName(name: string): this {
    throwIfFalsy(name, 'name');
    this.checkMutability();
    this.data.modelName = name;
    return this;
  }

  setInputName(name: string): this {
    throwIfFalsy(name, 'name');
    this.data.inputName = name;
    return this;
  }

  __getDBName(): string {
    return this.data.dbName ?? this.data.name ?? '';
  }

  __mustGetTable(): Table | JoinedTable {
    if (!this.data.table) {
      throw new Error(`Column "${toTypeString(this)}" doesn't have a table`);
    }
    return this.data.table;
  }

  __mustGetName(): string {
    if (!this.data.name) {
      throw new Error(`Column "${toTypeString(this)}" doesn't have a name`);
    }
    return this.data.name;
  }

  __getInputName(): string {
    const table = this.__mustGetTable();
    const name = this.__mustGetName();
    if (this.data.inputName) {
      return this.data.inputName;
    }

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    if (table instanceof JoinedTable) {
      if (table.associative) {
        return name;
      }
      return `${table.tableInputName()}_${name}`;
    }
    return name;
  }

  __getSourceTable(): Table | null {
    const { table } = this.data;
    if (!table) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    if (table instanceof JoinedTable) {
      return table.srcColumn.__getSourceTable();
    }
    return table;
  }

  __checkSourceTable(table: Table) {
    if (table !== this.__getSourceTable()) {
      throw new Error(
        `Source table assertion failed, expected "${table}", got "${this.__getSourceTable()}".`,
      );
    }
  }

  __getPath(): string {
    const table = this.__mustGetTable();
    const dbName = this.__getDBName();
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    if (table instanceof Table) {
      return `${table.getDBName()}.${dbName}`;
    }
    return `${table.keyPath}.${dbName}`;
  }

  toString(): string {
    let { name } = this.data;
    if (this.__getDBName() !== name) {
      name += `|${this.__getDBName()}`;
    }
    const tableStr = this.data.table?.toString() ?? '<null>';
    return `Column(${name}, ${tableStr})`;
  }

  join<T extends Table>(destTable: T, destCol?: Column, extraColumns?: [Column, Column][]): T {
    return this.joinCore(JoinType.inner, destTable, destCol, false, extraColumns || []);
  }

  leftJoin<T extends Table>(destTable: T, destCol?: Column, extraColumns?: [Column, Column][]): T {
    return this.joinCore(JoinType.left, destTable, destCol, false, extraColumns || []);
  }

  rightJoin<T extends Table>(destTable: T, destCol?: Column, extraColumns?: [Column, Column][]): T {
    return this.joinCore(JoinType.right, destTable, destCol, false, extraColumns || []);
  }

  fullJoin<T extends Table>(destTable: T, destCol?: Column, extraColumns?: [Column, Column][]): T {
    return this.joinCore(JoinType.full, destTable, destCol, false, extraColumns || []);
  }

  associativeJoin<T extends Table>(
    destTable: T,
    destCol?: Column,
    extraColumns?: [Column, Column][],
  ): T {
    return this.joinCore(JoinType.inner, destTable, destCol, true, extraColumns || []);
  }

  leftAssociativeJoin<T extends Table>(
    destTable: T,
    destCol?: Column,
    extraColumns?: [Column, Column][],
  ): T {
    return this.joinCore(JoinType.left, destTable, destCol, true, extraColumns || []);
  }

  rightAssociativeJoin<T extends Table>(
    destTable: T,
    destCol?: Column,
    extraColumns?: [Column, Column][],
  ): T {
    return this.joinCore(JoinType.right, destTable, destCol, true, extraColumns || []);
  }

  fullAssociativeJoin<T extends Table>(
    destTable: T,
    destCol?: Column,
    extraColumns?: [Column, Column][],
  ): T {
    return this.joinCore(JoinType.full, destTable, destCol, true, extraColumns || []);
  }

  // Called by `mm.table`.
  __configure(name: string, table: Table) {
    if (!this.data.name) {
      this.data.name = name;
    }
    if (!this.data.table) {
      this.data.table = table;
    }
  }

  private joinCore<T extends Table>(
    type: JoinType,
    destTable: T,
    destCol: Column | undefined,
    associative: boolean,
    extraColumns: [Column, Column][],
  ): T {
    throwIfFalsy(destTable, 'destTable');
    // source column + dest table + dest column = joined table

    // Try using dest table's PK if destCol is not present
    if (!destCol && destTable.__pks.length) {
      // eslint-disable-next-line prefer-destructuring, no-param-reassign
      destCol = destTable.__pks[0];
    }
    if (!destCol) {
      throw new Error('Cannot infer target column, please explicitly pass the "destCol" parameter');
    }

    // Join returns a proxy, each property access first retrieves the original column
    // from original joined table, then it constructs a new copied column with
    // `props.table` set to a newly created JoinedTable.
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const joinedTable = new JoinedTable(this, destTable, destCol, type, associative, extraColumns);
    return new Proxy<T>(destTable, {
      get(target, propKey, receiver) {
        const selectedColumn = Reflect.get(target, propKey, receiver) as Column | undefined;

        if (!selectedColumn) {
          throw new Error(
            `The column "${propKey.toString()}" does not exist on table ${toTypeString(target)}`,
          );
        }
        // returns a joined column.
        return Column.newJoinedColumn(selectedColumn, joinedTable);
      },
    });
  }

  private checkMutability() {
    if (Object.isFrozen(this)) {
      throw new Error(
        `The current column "${this.data.name}" of type ${toTypeString(
          this,
        )} cannot be modified, it is frozen. It is mostly likely because you are modifying a column from another table`,
      );
    }
  }
}

export class Table {
  #columns: Record<string, Column> = {};
  get __columns(): Readonly<Record<string, Column>> {
    return this.#columns;
  }

  #name!: string;
  get __name(): string {
    return this.#name;
  }

  #dbName: string | null = null;
  get __dbName(): string | null {
    return this.#dbName;
  }

  // Primary key columns.
  #pks: Column[] = [];
  get __pks(): ReadonlyArray<Column> {
    return this.#pks;
  }

  // Primary key with auto_increment columns.
  #aiPKs: Column[] = [];
  get __aiPKs(): ReadonlyArray<Column> {
    return this.#aiPKs;
  }

  getDBName(): string {
    return this.__dbName || this.__name;
  }

  getInputName(): string {
    return this.__name;
  }

  toString(): string {
    let name = this.__name;
    if (name !== this.getDBName()) {
      name += `|${this.getDBName()}`;
    }
    return `Table(${name})`;
  }

  // Called by `mm.table`.
  __configure(
    name: string,
    dbName: string | null,
    columns: Record<string, Column>,
    pks: Column[],
    aiPKs: Column[],
  ) {
    this.#name = name;
    this.#dbName = dbName;
    this.#columns = columns;
    this.#pks = pks;
    this.#aiPKs = aiPKs;
  }
}

/*
 post.user_id.join(user) -> this creates a intermediate joined table

 srcColumn: post.user_id (Column | JoinedColumn)
 destTable: user (Table)
 destColumn: user.id (Column)
*/
export class JoinedTable {
  // `keyPath` is useful to detect duplicate joins, if multiple `JoinedTable` instances are
  // created with same columns and tables, they'd have the same `keyPath`.
  readonly keyPath: string;

  constructor(
    public readonly srcColumn: Column,
    public readonly destTable: Table,
    public readonly destColumn: Column,
    public readonly type: JoinType,
    public readonly associative: boolean, // If `srcColumn` is associative.
    public readonly extraColumns: [Column, Column][], // Join tables with composite PKs.
  ) {
    const srcTable = srcColumn.__mustGetTable();
    let localTableString: string;
    if (srcTable instanceof JoinedTable) {
      // Source column is a joined column.
      localTableString = srcTable.keyPath;
    } else {
      localTableString = srcTable.getDBName();
    }
    const remoteTableString = destTable.getDBName();
    let keyPath = `(J|${this.type}|${localTableString}|${remoteTableString})`;
    // Append columns.
    // We are not using `column.getPath()` as we assume src and dest columns are
    // always from src and dest tables.
    // Primary columns.
    keyPath += `[${srcColumn.__getDBName()}|${destColumn.__getDBName()}]`;

    // Extra columns.
    for (const [col1, col2] of extraColumns) {
      keyPath += `[${col1.__getDBName()}|${col2.__getDBName()}]`;
    }
    this.keyPath = keyPath;
  }

  tableInputName(): string {
    const { srcColumn } = this;
    const srcTable = srcColumn.__mustGetTable();
    const srcName = srcColumn.__mustGetName();
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const curName = makeMiddleName(srcName);
    if (srcTable instanceof JoinedTable) {
      if (srcTable.associative) {
        return curName;
      }
      // If `srcColumn` is a joined column, e.g.
      // `cmt.post_id.join(post).user_id.join(user)`, returns `post_user` in this case.
      return `${srcTable.tableInputName()}_${curName}`;
    }
    // If `srcColumn` is not a joined column, omit the table name,
    // e.g. `post.user_id.join(user)`, returns `user.
    return curName;
  }

  toString(): string {
    return this.keyPath;
  }
}

// Generates a column name for a join, we call it a middle and we need to cut the trailing `_id`,
// e.g. `SELECT post.user_id.join(user).name`, the `user_id` before the join is the middle name,
// the input name for this column is `userName`.
function makeMiddleName(s: string): string {
  if (!s) {
    throw new Error('Unexpected empty value in "makeMiddleName"');
  }
  return utils.stripTrailingSnakeID(s);
}
