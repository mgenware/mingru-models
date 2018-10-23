import { throwIfFalsy } from 'throw-if-arg-empty';
import dt from './dt';
export { default as DataTypes } from './dt';

/** Core types */
export class ColumnBase {
  table!: Table;
  name!: string;
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
  TableColumns: ColumnBase[];
  TableName!: string;

  constructor() {
    this.TableColumns = [];
  }
}

const TABLE_CORE_PROPS = new Set<string>(['TableName', 'TableColumns']);

  // tslint:disable-next-line
export function table<T>(cls: { new(): T }): T {
  throwIfFalsy(cls, 'cls');
  const obj = new cls();
  const name = obj.constructor.name;
  const t = new Table();
  t.TableName = name.toLowerCase();
  const cols = t.TableColumns;
  for (const pair of Object.entries(obj)) {
    const k = pair[0] as string;
    if (TABLE_CORE_PROPS.has(k)) {
      continue;
    }
    const v = pair[1] as ColumnBase;
    if (v instanceof ColumnBase === false) {
      throw new Error(`Invalid column at property "${k}", class ${name}`);
    }

    if (v.name) {
      // This is an FK
      cols.push(new ForeignColumn(v));
    } else {
      v.name = k;
      cols.push(v);
    }
  }
  return (t as unknown) as T;
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
