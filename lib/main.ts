import { throwIfFalsy } from 'throw-if-arg-empty';
import dt from './dt';
export { default as DataTypes } from './dt';

const InternalPropPrefix = '__';

/** Core types */
export class ColumnBase {
  __table!: Table;
  __name!: string;

  get tableName(): string {
    return this.__table.__name;
  }

  get path(): string {
    return `${this.tableName}.${this.__name}`;
  }

  join<T extends Table>(remoteTable: T, remoteColumn?: ColumnBase): T {
    const localColumn = this;
    let rc: ColumnBase;
    if (remoteColumn) {
      if (remoteColumn.__table !== remoteTable) {
        throw new Error(`The remote column "${remoteColumn}" does not belong to the remote table "${remoteTable}"`);
      }
      rc = remoteColumn;
    } else {
      if (this instanceof ForeignColumn === false) {
        throw new Error(`Local column "${this}" is not a foreign column, you have to specify the "remoteColumn" argument`);
      }
      rc = ((this as unknown) as ForeignColumn).ref;
    }
    return new Proxy<T>(remoteTable, {
      get(target, propKey, receiver) {
        const targetColumn = Reflect.get(target, propKey, receiver) as Column;
        return new JoinedColumn(localColumn, rc, targetColumn);
      },
    });
  }
}

export class ForeignColumn extends ColumnBase {
  constructor(
    name: string,
    tbl: Table,
    public ref: ColumnBase,
  ) {
    super();
    throwIfFalsy(ref, 'ref');
    this.__name = name;
    this.__table = tbl;
  }
}

export class Column extends ColumnBase {
  pk = false;
  notNull = false;
  unsigned = false;
  unique = false;
  length = 0;
  default: unknown = undefined;

  types = new Set<string>();

  constructor(
    types: string[]|string,
  ) {
    super();
    throwIfFalsy(types, 'types');

    if (Array.isArray(types)) {
      for (const t of types) {
        this.types.add(t);
      }
    } else {
      this.types.add(types as string);
    }
  }
}

export class Table {
  __columns: ColumnBase[];
  __name!: string;

  constructor() {
    this.__columns = [];
  }
}

// tslint:disable-next-line
export function table<T extends Table>(cls: { new(): T }): T {
  throwIfFalsy(cls, 'cls');
  const tableObj = new cls();
  const className = tableObj.constructor.name;
  tableObj.__name = className.toLowerCase();
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
      throw new Error(`Invalid column at property "${colName}", expected a ColumnBase, got "${col}"`);
    }

    if (col.__name) {
      // Foreign column
      const fc = new ForeignColumn(colName, tableObj, col);
      // tslint:disable-next-line
      (tableObj as any)[colName] = fc;
      cols.push(fc);
    } else {
      col.__name = colName;
      col.__table = tableObj;
      cols.push(col);
    }
  }
  return (tableObj as unknown) as T;
}

/** Column creation helpers */
export function pk(): Column {
  const col = new Column(dt.BigInt);
  col.pk = true;
  col.unique = true;
  return col;
}

export function varChar(length: number, defaultValue?: string): Column {
  const col = new Column(dt.VarChar);
  col.length = length;
  col.default = defaultValue;
  return col;
}

export function char(length: number, defaultValue?: string): Column {
  const col = new Column(dt.Char);
  col.length = length;
  col.default = defaultValue;
  return col;
}

export function int(defaultValue?: string): Column {
  const col = new Column(dt.Int);
  col.default = defaultValue;
  return col;
}

export function notNull(col: Column): Column {
  throwIfFalsy(col, 'col');
  col.notNull = true;
  return col;
}

/** Joins */
export class JoinedColumn extends ColumnBase {
  constructor(
    public localColumn: ColumnBase,
    public remoteColumn: ColumnBase,
    public targetColumn: ColumnBase,
  ) {
    super();

    throwIfFalsy(localColumn, 'localColumn');
    throwIfFalsy(remoteColumn, 'remoteColumn');
    throwIfFalsy(targetColumn, 'targetColumn');
    // Both __table and __name point to the target column
    this.__table = targetColumn.__table;
    this.__name = targetColumn.__name;
  }
}
