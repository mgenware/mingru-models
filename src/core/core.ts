import { throwIfFalsy } from 'throw-if-arg-empty';
import toTypeString from 'to-type-string';
import utils from '../lib/utils';

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

export class Column {
  static fromTypes(types: string | string[], defaultValue?: unknown): Column {
    const col = new Column(new ColumnType(typeof types === 'string' ? [types] : types));
    col.#defaultValue = defaultValue;
    return col;
  }

  static newForeignColumn(
    srcColumn: Column,
    table: Table | null, // can be null, used by mm.fk which doesn't have a table param
  ): Column {
    throwIfFalsy(srcColumn, 'srcColumn');

    const copied = Column.copyFrom(srcColumn, table, null);
    copied.#foreignColumn = srcColumn;
    // For foreign column, `__name` is reset to null
    copied.#name = null;
    return copied;
  }

  static newJoinedColumn(mirroredColumn: Column, table: JoinedTable): Column {
    const copied = Column.copyFrom(mirroredColumn, table, mirroredColumn.__name);
    copied.#mirroredColumn = mirroredColumn;
    return copied;
  }

  private static copyFrom(
    column: Column,
    newTable: Table | JoinedTable | null,
    newName: string | null,
  ): Column {
    const res = new Column(column.__type);
    // Copy values
    res.#defaultValue = column.__defaultValue;
    if (newTable) {
      res.#table = newTable;
    }
    if (newName) {
      res.#name = newName;
    }
    res.#foreignColumn = column.__foreignColumn;
    res.#mirroredColumn = column.__mirroredColumn;
    // Reset value
    res.__type.pk = false;
    res.__type.autoIncrement = false;
    return res;
  }

  #name: string | null = null;
  get __name(): string | null {
    return this.#name;
  }

  #type: ColumnType;
  get __type(): ColumnType {
    return this.#type;
  }

  #defaultValue: unknown;
  get __defaultValue(): unknown {
    return this.#defaultValue;
  }

  #noDefaultOnCSQL = false;
  get __noDefaultOnCSQL(): boolean {
    return this.#noDefaultOnCSQL;
  }

  #dbName: string | null = null;
  get __dbName(): string | null {
    return this.#dbName;
  }

  #table: Table | JoinedTable | null = null;
  get __table(): Table | JoinedTable | null {
    return this.#table;
  }

  #inputName: string | null = null;
  get __inputName(): string | null {
    return this.#inputName;
  }

  // After v0.14.0, Column.foreignColumn is pretty useless since we allow join any column to any
  // table, the foreignColumn property only indicates a column property is declared as FK and
  // doesn't have any effect on join(), the real dest table and column are determined by join().
  #foreignColumn: Column | null = null;
  get __foreignColumn(): Column | null {
    return this.#foreignColumn;
  }

  // See `Column.join` for details
  #mirroredColumn: Column | null = null;
  get __mirroredColumn(): Column | null {
    return this.#mirroredColumn;
  }

  constructor(type: ColumnType) {
    throwIfFalsy(type, 'type');
    // Copy if frozen.
    if (Object.isFrozen(type)) {
      const t = new ColumnType(type.types);
      Object.assign(t, type);
      // Deep copy types
      t.types = [...type.types];
      this.#type = t;
    } else {
      this.#type = type;
    }
  }

  get nullable(): Column {
    this.checkMutability();
    this.__type.nullable = true;
    return this;
  }

  get unique(): Column {
    this.checkMutability();
    this.__type.unique = true;
    return this;
  }

  get autoIncrement(): Column {
    this.checkMutability();
    this.__type.autoIncrement = true;
    return this;
  }

  get noAutoIncrement(): Column {
    this.checkMutability();
    this.__type.autoIncrement = false;
    return this;
  }

  get noDefaultOnCSQL(): Column {
    this.checkMutability();
    this.#noDefaultOnCSQL = true;
    return this;
  }

  freeze() {
    Object.freeze(this.__type);
    Object.freeze(this);
  }

  default(value: unknown): this {
    this.checkMutability();
    this.#defaultValue = value;
    return this;
  }

  setDBName(name: string): this {
    throwIfFalsy(name, 'name');
    this.checkMutability();
    this.#dbName = name;
    return this;
  }

  setInputName(name: string): this {
    throwIfFalsy(name, 'name');
    this.#inputName = name;
    return this;
  }

  getDBName(): string {
    return this.__dbName || this.__name || '';
  }

  mustGetTable(): Table | JoinedTable {
    if (!this.__table) {
      throw new Error(`Column "${toTypeString(this)}" doesn't have a table`);
    }
    return this.__table;
  }

  mustGetName(): string {
    if (!this.__name) {
      throw new Error(`Column "${toTypeString(this)}" doesn't have a name`);
    }
    return this.__name;
  }

  inputName(): string {
    const table = this.mustGetTable();
    const name = this.mustGetName();
    if (this.__inputName) {
      return this.__inputName;
    }
    const curName = utils.toCamelCase(name);

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    if (table instanceof JoinedTable) {
      if (table.associative) {
        return curName;
      }
      return table.tableInputName() + utils.capitalizeColumnName(curName);
    }
    return curName;
  }

  getSourceTable(): Table | null {
    const table = this.__table;
    if (!table) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
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
    if (!this.__name) {
      this.#name = name;
    }
    if (!this.__table) {
      this.#table = table;
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
        `The current column "${this.__name}" of type ${toTypeString(
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

  inputName(): string {
    return utils.toCamelCase(this.__name);
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
    let localPath: string;
    const srcTable = srcColumn.mustGetTable();
    if (srcTable instanceof JoinedTable) {
      // Source column is a joined column.
      const srcTableKeyPath = srcTable.keyPath;
      localPath = `[${srcTableKeyPath}.${srcColumn.__name}]`;
    } else {
      localPath = `[${srcTable.__name}.${srcColumn.__name}]`;
    }

    const remotePath = `[${destTable.__name}.${destColumn.__name}]`;
    this.keyPath = `[${localPath}.${remotePath}]`;
  }

  tableInputName(): string {
    const { srcColumn } = this;
    const srcTable = srcColumn.mustGetTable();
    const srcName = srcColumn.mustGetName();
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const curName = makeMiddleName(srcName);
    if (srcTable instanceof JoinedTable) {
      if (srcTable.associative) {
        return curName;
      }
      // If `srcColumn` is a joined column, e.g.
      // `cmt.post_id.join(post).user_id.join(user)`, returns `postUser in this case.
      return srcTable.tableInputName() + utils.capitalizeFirstLetter(curName);
    }
    // If `srcColumn` is not a joined column, omit the table name,
    // e.g. `post.user_id.join(user)`, returns `user.
    return curName;
  }

  toString(): string {
    return `JoinedTable(${this.keyPath})`;
  }
}

// Generates a column name for a join, we call it a middle and we need to cut the trailing `_id`,
// e.g. `SELECT post.user_id.join(user).name`, the `user_id` before the join is the middle name,
// the input name for this column is `userName`.
function makeMiddleName(s: string): string {
  if (!s) {
    throw new Error('Unexpected empty value in "makeMiddleName"');
  }
  return utils.toCamelCase(utils.stripTrailingSnakeID(s));
}
