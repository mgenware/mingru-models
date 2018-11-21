import { throwIfFalsy } from 'throw-if-arg-empty';
import { capitalizeFirstLetter } from '../lib/stringUtil';
export { default as DataTypes } from './dt';

const InternalPropPrefix = '__';

/** Core types */
export class ColumnBase {
  __table!: Table;
  __name!: string;

  __getTargetColumn(): Column {
    if (this instanceof Column) {
      return this as Column;
    }
    if (this instanceof ForeignColumn) {
      return (this as ForeignColumn).ref.__getTargetColumn();
    }
    if (this instanceof JoinedColumn) {
      return (this as JoinedColumn).selectedColumn.__getTargetColumn();
    }
    throw new Error(`Not supported column type: ${this}`);
  }

  __getInputName(): string {
    return `${this.tableName}${capitalizeFirstLetter(this.__name)}`;
  }

  get tableName(): string {
    return this.__table.__name;
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
      // See README.md (JoinedColumn for details)
      if (this instanceof JoinedColumn) {
        rc = this.remoteColFromFCOrThrow(((this as unknown) as JoinedColumn).selectedColumn);
      } else {
        rc = this.remoteColFromFCOrThrow();
      }
    }
    return new Proxy<T>(remoteTable, {
      get(target, propKey, receiver) {
        const targetColumn = Reflect.get(target, propKey, receiver) as Column;
        let localPath: string;
        if (localColumn instanceof JoinedColumn) {
          const colPath = ((localColumn as unknown) as JoinedColumn).joinPath;
          localPath = `[${colPath}.${localColumn.__name}]`;
        } else {
          localPath = `[${localColumn.__table.__name}.${localColumn.__name}]`;
        }
        const remotePath = `[${rc.__table.__name}.${rc.__name}]`;
        const path = `[${localPath}.${remotePath}]`;
        return new JoinedColumn(path, localColumn, rc, targetColumn);
      },
    });
  }

  private remoteColFromFCOrThrow(col?: ColumnBase): ColumnBase {
    col = col || this;
    if (col instanceof ForeignColumn) {
      return ((col as unknown) as ForeignColumn).ref;
    }
    throw new Error(`Local column "${col}" is not a foreign column, you have to specify the "remoteColumn" argument`);
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

export class JoinedColumn extends ColumnBase {
  constructor(
    /** Note that joinPath does not include the selected column name. */
    public joinPath: string,
    public localColumn: ColumnBase,
    public remoteColumn: ColumnBase,
    public selectedColumn: ColumnBase,
  ) {
    super();

    throwIfFalsy(localColumn, 'localColumn');
    throwIfFalsy(remoteColumn, 'remoteColumn');
    throwIfFalsy(selectedColumn, 'selectedColumn');
    // Both __table and __name point to the selected column
    this.__table = selectedColumn.__table;
    this.__name = selectedColumn.__name;
  }
}
