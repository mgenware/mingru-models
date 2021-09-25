import { throwIfFalsy } from 'throw-if-arg-empty';
import { ColumnAttribute } from '../attrs.js';
import * as utils from '../lib/utils.js';

export class ColumnType {
  types: string[];
  pk = false;
  nullable = false;
  unsigned = false;
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
  inner = 1,
  left,
  right,
  full,
}

export interface ColumnData {
  type: ColumnType;

  propertyName?: string;
  defaultValue?: unknown;
  noDefaultValueOnCSQL?: boolean;
  dbName?: string;
  modelName?: string;
  table?: Table | JoinTable;
  // After v0.14.0, Column.foreignColumn is pretty useless since we allow join any column to any
  // table, the foreignColumn property only indicates a column property is declared as FK and
  // doesn't have any effect on join(), the real dest table and column are determined by join().
  foreignColumn?: Column;
  // See `Column.join` for details.
  mirroredColumn?: Column;

  uniqueConstraint?: boolean;
  index?: boolean;
  // No effect when `index` is false;
  isUniqueIndex?: boolean;
}

export class Column {
  static fromTypes(types: string | string[], defaultValue?: unknown): Column {
    const col = new Column(new ColumnType(typeof types === 'string' ? [types] : types));
    col.__data.defaultValue = defaultValue;
    return col;
  }

  static newForeignColumn(srcColumn: Column): Column {
    throwIfFalsy(srcColumn, 'srcColumn');

    const col = new Column(srcColumn.__type());
    const cd = col.__data;
    cd.foreignColumn = srcColumn;
    return col;
  }

  static newJoinedColumn(mirroredColumn: Column, table: JoinTable): Column {
    throwIfFalsy(mirroredColumn, 'mirroredColumn');
    throwIfFalsy(table, 'table');
    const col = new Column(mirroredColumn.__type());
    const cd = col.__data;
    cd.mirroredColumn = mirroredColumn;
    return col;
  }

  protected __data: ColumnData;
  __getData(): ColumnData {
    return this.__data;
  }

  get #data(): ColumnData {
    return this.__data;
  }

  constructor(type: ColumnType) {
    throwIfFalsy(type, 'type');
    const copiedType = new ColumnType(type.types);
    Object.assign(copiedType, type);
    // Deep copy types
    copiedType.types = [...type.types];
    this.__data = {
      type: copiedType,
    };
  }

  get nullable(): Column {
    this.__type().nullable = true;
    return this;
  }

  get uniqueConstraint(): Column {
    this.#data.uniqueConstraint = true;
    return this;
  }

  get index(): Column {
    this.#data.index = true;
    return this;
  }

  get uniqueIndex(): Column {
    this.#data.index = true;
    this.#data.isUniqueIndex = true;
    return this;
  }

  get autoIncrement(): Column {
    this.__type().autoIncrement = true;
    return this;
  }

  get noAutoIncrement(): Column {
    this.__type().autoIncrement = false;
    return this;
  }

  get noDefaultValueOnCSQL(): Column {
    this.#data.noDefaultValueOnCSQL = true;
    return this;
  }

  default(value: unknown): this {
    this.#data.defaultValue = value;
    return this;
  }

  setDBName(name: string): this {
    throwIfFalsy(name, 'name');
    this.#data.dbName = name;
    return this;
  }

  setModelName(name: string): this {
    throwIfFalsy(name, 'name');
    this.#data.modelName = name;
    return this;
  }

  __freeze() {
    Object.freeze(this.#data.type);
    Object.freeze(this.#data);
    Object.freeze(this);
  }

  __getDBName(): string {
    return this.#data.dbName ?? this.__mustGetPropertyName();
  }

  __getModelName(): string {
    return this.#data.modelName ?? this.__mustGetPropertyName();
  }

  __mustGetTable(): Table | JoinTable {
    if (!this.#data.table) {
      throw new Error(`Column "${this}" doesn't have a table`);
    }
    return this.#data.table;
  }

  __type(): ColumnType {
    return this.#data.type;
  }

  __mustGetPropertyName(): string {
    if (!this.#data.propertyName) {
      throw new Error(`Column "${this}" doesn't have a name`);
    }
    return this.#data.propertyName;
  }

  __getInputName(): string {
    const table = this.__mustGetTable();
    const name = this.__getModelName();

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    if (table instanceof JoinTable) {
      if (table.associative) {
        return name;
      }
      return `${table.tableInputName()}_${name}`;
    }
    return name;
  }

  __getSourceTable(): Table | null {
    const { table } = this.#data;
    if (!table) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    if (table instanceof JoinTable) {
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
      return `${table.__getDBName()}.${dbName}`;
    }
    return `${table.keyPath}.${dbName}`;
  }

  toString(): string {
    const d = this.#data;
    let name = d.propertyName;
    const dbName = this.__getDBName();
    if (dbName && dbName !== name) {
      name += `|${this.__getDBName()}`;
    }
    const tableStr = this.#data.table?.toString() ?? '';
    return `Column(${name ?? ''}${tableStr ? `, ${tableStr}` : ''})`;
  }

  join<T extends Table>(
    destTable: T,
    destCol?: Column,
    extraColumns?: [Column, Column][],
    extraSQLFn?: (jt: T) => SQL,
  ): T {
    return this.joinCore(JoinType.inner, destTable, destCol, false, extraColumns || [], extraSQLFn);
  }

  leftJoin<T extends Table>(
    destTable: T,
    destCol?: Column,
    extraColumns?: [Column, Column][],
    extraSQLFn?: (jt: T) => SQL,
  ): T {
    return this.joinCore(JoinType.left, destTable, destCol, false, extraColumns || [], extraSQLFn);
  }

  rightJoin<T extends Table>(
    destTable: T,
    destCol?: Column,
    extraColumns?: [Column, Column][],
    extraSQLFn?: (jt: T) => SQL,
  ): T {
    return this.joinCore(JoinType.right, destTable, destCol, false, extraColumns || [], extraSQLFn);
  }

  fullJoin<T extends Table>(
    destTable: T,
    destCol?: Column,
    extraColumns?: [Column, Column][],
    extraSQLFn?: (jt: T) => SQL,
  ): T {
    return this.joinCore(JoinType.full, destTable, destCol, false, extraColumns || [], extraSQLFn);
  }

  associativeJoin<T extends Table>(
    destTable: T,
    destCol?: Column,
    extraColumns?: [Column, Column][],
    extraSQLFn?: (jt: T) => SQL,
  ): T {
    return this.joinCore(JoinType.inner, destTable, destCol, true, extraColumns || [], extraSQLFn);
  }

  leftAssociativeJoin<T extends Table>(
    destTable: T,
    destCol?: Column,
    extraColumns?: [Column, Column][],
    extraSQLFn?: (jt: T) => SQL,
  ): T {
    return this.joinCore(JoinType.left, destTable, destCol, true, extraColumns || [], extraSQLFn);
  }

  rightAssociativeJoin<T extends Table>(
    destTable: T,
    destCol?: Column,
    extraColumns?: [Column, Column][],
    extraSQLFn?: (jt: T) => SQL,
  ): T {
    return this.joinCore(JoinType.right, destTable, destCol, true, extraColumns || [], extraSQLFn);
  }

  fullAssociativeJoin<T extends Table>(
    destTable: T,
    destCol?: Column,
    extraColumns?: [Column, Column][],
    extraSQLFn?: (jt: T) => SQL,
  ): T {
    return this.joinCore(JoinType.full, destTable, destCol, true, extraColumns || [], extraSQLFn);
  }

  // Called by `mm.table`.
  __configure(name: string, table: Table) {
    const d = this.#data;
    if (d.propertyName || d.table) {
      throw new Error('Column.data is already set');
    }
    this.#data.propertyName = name;
    this.#data.table = table;
  }

  private joinCore<T extends Table>(
    type: JoinType,
    destTable: T,
    destCol: Column | undefined,
    associative: boolean,
    extraColumns: [Column, Column][],
    extraSQLFn: ((jt: T) => SQL) | undefined,
  ): T {
    throwIfFalsy(destTable, 'destTable');
    // source column + dest table + dest column = joined table

    // Try using dest table's PK if destCol is not present
    if (!destCol && destTable.__getData().pks.length) {
      // eslint-disable-next-line prefer-destructuring, no-param-reassign
      destCol = destTable.__getData().pks[0];
    }
    if (!destCol) {
      throw new Error('Cannot infer target column, please explicitly pass the "destCol" parameter');
    }

    // Join returns a proxy, each property access first retrieves the original column
    // from original joined table, then it constructs a new copied column with
    // `props.table` set to a newly created JoinTable.
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const joinedTable = new JoinTable(this, destTable, destCol, type, associative, extraColumns);
    const proxy = new Proxy<T>(destTable, {
      get(target, propKey, receiver) {
        const selectedColumn = Reflect.get(target, propKey, receiver) as Column | undefined;

        if (!selectedColumn) {
          throw new Error(`The column "${propKey.toString()}" does not exist on table ${target}`);
        }
        // returns a joined column.
        return Column.newJoinedColumn(selectedColumn, joinedTable);
      },
    });
    if (extraSQLFn) {
      joinedTable.__internalSetExtraSQL(extraSQLFn(proxy));
    }
    return proxy;
  }
}

export interface TableData {
  columns: Record<string, Column | undefined>;
  name: string;
  dbName?: string;
  pks: Column[];
  aiPKs: Column[];
}

export class Table {
  protected __data: TableData;

  constructor() {
    this.__data = {
      columns: {},
      name: '',
      pks: [],
      aiPKs: [],
    };
  }

  __getData(): TableData {
    return this.__data;
  }

  __getDBName(): string {
    const data = this.__data;
    return data.dbName ?? data.name;
  }

  __getInputName(): string {
    return this.__data.name;
  }

  toString(): string {
    let { name } = this.__data;
    if (name !== this.__getDBName()) {
      name += `|${this.__getDBName()}`;
    }
    return `Table(${name})`;
  }

  // Called by `mm.table`.
  __configure(
    name: string,
    dbName: string | undefined,
    columns: Record<string, Column | undefined>,
    pks: Column[],
    aiPKs: Column[],
  ) {
    const data = this.__data;
    data.name = name;
    data.dbName = dbName;
    data.columns = columns;
    data.pks = pks;
    data.aiPKs = aiPKs;
  }
}

/*
 post.user_id.join(user) -> this creates a intermediate joined table

 srcColumn: post.user_id (Column | JoinedColumn)
 destTable: user (Table)
 destColumn: user.id (Column)
*/
export class JoinTable {
  // `keyPath` is useful to detect duplicate joins, if multiple `JoinTable` instances are
  // created with same columns and tables, they'd have the same `keyPath`.
  readonly keyPath: string;

  #extraSQL: SQL | undefined;
  get extraSQL(): SQL | undefined {
    return this.#extraSQL;
  }

  // Called by `joinCore` internally.
  __internalSetExtraSQL(s: SQL) {
    this.#extraSQL = s;
  }

  constructor(
    public readonly srcColumn: Column,
    public readonly destTable: Table,
    public readonly destColumn: Column,
    public readonly joinType: JoinType,
    public readonly associative: boolean, // If `srcColumn` is associative.
    public readonly extraColumns: [Column, Column][], // Join tables with composite PKs.
  ) {
    const srcTable = srcColumn.__mustGetTable();
    let localTableString: string;
    if (srcTable instanceof JoinTable) {
      // Source column is a joined column.
      localTableString = srcTable.keyPath;
    } else {
      localTableString = srcTable.__getDBName();
    }
    const remoteTableString = destTable.__getDBName();
    let keyPath = `(J|${this.joinType}|${localTableString}|${remoteTableString})`;
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
    const srcName = srcColumn.__getModelName();
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const curName = makeMiddleName(srcName);
    if (srcTable instanceof JoinTable) {
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

export interface SQLVariableType {
  type: string;
  defaultValue: unknown;
  module?: string;
  importPath?: string;
}

export class SQLVariable {
  readonly isArray: boolean;

  constructor(
    public readonly type: SQLVariableType | Column | ColumnType,
    public readonly name?: string,
    isArray?: boolean,
    public readonly column?: Column | undefined,
    // Use this to override the nullability of the `type` property.
    public readonly nullable?: boolean,
  ) {
    throwIfFalsy(type, 'type');
    this.isArray = isArray || false;
  }

  scalarVariable(handleArray: boolean): SQLVariable {
    return new SQLVariable(
      this.type,
      this.name,
      handleArray ? false : this.isArray,
      this.column,
      false,
    );
  }

  toString(): string {
    const { type } = this;
    let desc = '';
    if (typeof type === 'string') {
      desc = `String(${type})`;
    } else if (type instanceof Column || type instanceof ColumnType) {
      desc = type.toString();
    } else {
      desc = JSON.stringify(type);
    }
    let s = `SQLVar(${this.name}, desc = ${desc})`;
    if (this.nullable) {
      s += '?';
    }
    if (this.isArray) {
      s += '[]';
    }
    return s;
  }
}

export enum SQLElementType {
  rawString,
  column,
  input,
  call,
  rawColumn,
  action,
}

export class SQLElement {
  constructor(public readonly type: SQLElementType, public readonly value: unknown) {}

  toString(): string {
    const { value } = this;
    return `E(${value !== undefined && value !== null ? `${value}, ` : ''}type = ${this.type})`;
  }
}

export class SQL {
  constructor(public elements: ReadonlyArray<SQLElement>) {}

  toString(): string {
    return `SQL(${this.elements.map((e) => e.toString()).join(', ')})`;
  }
}

export interface RawColumnData {
  core?: Column | SQL;
  selectedName?: string;
  type?: ColumnType;
  attrs?: Map<ColumnAttribute, unknown>;
}

export class RawColumn {
  protected __data: RawColumnData = {};
  __getData(): RawColumnData {
    return this.__data;
  }

  private get data(): RawColumnData {
    return this.__data;
  }

  private mustGetAttrs(): Map<ColumnAttribute, unknown> {
    return (this.data.attrs ??= new Map<ColumnAttribute, unknown>());
  }

  constructor(
    core: Column | SQL,
    // `selectedName` can be undefined if `core` is a column.
    // In that case, when you call `toInput`, a name will be generated from all its joined columns,
    // so that you don't need to specify names when using joins.
    selectedName?: string,
    type?: ColumnType,
  ) {
    throwIfFalsy(core, 'core');

    this.data.selectedName = selectedName;
    this.data.type = type;
    if (core instanceof Column) {
      this.data.core = core;
    } else {
      this.data.core = core;
      if (!selectedName) {
        throw new Error(
          'The argument `selectedName` is required for a `RawColumn` with SQL expression',
        );
      }
    }
  }

  attr(name: ColumnAttribute, value: unknown): this {
    this.mustGetAttrs().set(name, value);
    return this;
  }

  privateAttr(): this {
    return this.attr(ColumnAttribute.isPrivate, true);
  }

  toString(): string {
    return `RawColumn(${this.data.selectedName}, core = ${this.data.core})`;
  }
}

export enum SQLCallType {
  localDatetimeNow, // NOW() for DATETIME
  localDateNow, // NOW() for DATE
  localTimeNow, // NOW() for TIME
  count, // COUNT()
  avg, // AVG()
  sum, // SUM()
  coalesce, // COALESCE()
  min, // MIN()
  max, // MAX()
  year,
  month,
  week,
  day,
  hour,
  minute,
  second,
  utcDatetimeNow,
  utcDateNow,
  utcTimeNow,
  timestampNow,
  exists,
  notExists,
  ifNull,
  // Use uppercase to not conflict with the if keyword.
  IF,
}

export class SQLCall {
  #returnType: ColumnType | number;
  get returnType(): ColumnType | number {
    return this.#returnType;
  }

  constructor(
    public readonly type: SQLCallType,
    // A number value indicates the return value is inferred from the index of a params.
    returnType: ColumnType | number,
    public readonly params: ReadonlyArray<SQL>,
  ) {
    this.#returnType = returnType;
  }

  toString(): string {
    let paramsDesc = '';
    if (this.params.length) {
      paramsDesc = `, params = ${this.params.join(', ')})`;
    }
    return `SQLCall(${this.type}, return = ${this.returnType.toString()}${paramsDesc}`;
  }

  setReturnType(type: ColumnType): this {
    this.#returnType = type;
    return this;
  }
}
