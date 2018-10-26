import { throwIfFalsy } from 'throw-if-arg-empty';
import dt from './dt';
export { default as DataTypes } from './dt';

/** Core types */
export class ColumnBase {
  __table!: Table;
  name!: string;

  join<T extends Table>(destTable: T): T {
    const that = this;
    return new Proxy<T>(destTable, {
      get(target, propKey, receiver) {
        const destCol = Reflect.get(target, propKey, receiver) as ColumnBase;
        return new JoinedColumn(that, destCol);
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
    if (colName.startsWith('__')) {
      continue;
    }
    const colObj = pair[1] as ColumnBase;
    if (!colObj) {
      throw new Error(`Empty column object at property "${colName}"`);
    }
    if (colObj instanceof ColumnBase === false) {
      throw new Error(`Invalid column at property "${colName}", expected a ColumnBase, got "${colObj}"`);
    }

    if (colObj.name) {
      // This is an FK
      const fkColObj = new ForeignColumn(colObj);
      // tslint:disable-next-line
      (tableObj as any)[colName] = fkColObj;
      cols.push(fkColObj);
    } else {
      colObj.name = colName;
      cols.push(colObj);
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
    public srcCol: ColumnBase,
    public destCol: ColumnBase,
  ) {
    super();
  }
}
