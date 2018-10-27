import { throwIfFalsy } from 'throw-if-arg-empty';
import dt from './dt';
export { default as DataTypes } from './dt';

const InternalPropPrefix = '__';
const ColumnTypeProp = '__type';

export enum ColumnType {
  Default = 1,
  Joined,
}

/** Core types */
export class ColumnBase {
  __table!: Table;
  __name!: string;
  __type = ColumnType.Default;

  get isDefaultColumn(): boolean {
    return this.__type === ColumnType.Default;
  }

  get isJoinedColumn(): boolean {
    return this.__type === ColumnType.Joined;
  }

  get path(): string {
    if (!this.__table) {
      throw new Error(`__table not set on this type "${this}:${this.__type}"`);
    }
    return `${this.__table.__name}.${this.__name}`;
  }

  join<T extends Table>(destTable: T): T {
    const srcColumn = this;
    return new Proxy<T>(destTable, {
      get(target, propKey, receiver) {
        switch (propKey) {
          case ColumnTypeProp:
            return ColumnType.Joined;
          case '__destTable':
            return destTable;
          case '__srcColumn':
            return srcColumn;
        }
        const destCol = Reflect.get(target, propKey, receiver) as Column;
        return new JoinedColumn(srcColumn, destCol);
      },
    });
  }
}

export class ForeignColumn extends ColumnBase {
  constructor(
    public ref: ColumnBase,
  ) {
    super();
    throwIfFalsy(ref, 'ref');
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
      throw new Error(`Error creating column "${colName}". It seems you are using a column from another table, please use the fk function to create foreign key column`);
    }
    col.__name = colName;
    col.__table = tableObj;
    cols.push(col);
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

export function fk(ref: ColumnBase): ForeignColumn {
  throwIfFalsy(ref, 'ref');
  return new ForeignColumn(ref);
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
    public localCol: ColumnBase,
    public remoteCol: ColumnBase,
  ) {
    super();
    this.__type = ColumnType.Joined;
  }
}
