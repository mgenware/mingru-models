import { throwIfFalsy } from 'throw-if-arg-empty';
import {
  Table,
  ColumnBase,
  ColumnBaseType,
  ForeignColumn,
  Column,
} from './core';
import { utils } from '../main';
import toTypeString from 'to-type-string';
import { FKWrapper } from './fk';
import * as defs from './defs';

function isValidColumn(col: unknown): boolean {
  return col instanceof Column || col instanceof FKWrapper;
}

export function enumerateColumns(
  tableObject: Table,
  cb: (column: ColumnBase, prop: string) => void,
) {
  throwIfFalsy(tableObject, 'tableObject');
  if (!cb) {
    return;
  }

  for (const pair of Object.entries(tableObject)) {
    const prop = pair[0] as string;
    // Ignore internal props
    if (prop.startsWith(defs.InternalPropPrefix)) {
      continue;
    }
    const col = pair[1] as ColumnBase;
    cb(col, prop);
  }
}

export function table<T extends Table>(
  cls: new (name?: string) => T,
  name?: string,
): T {
  throwIfFalsy(cls, 'cls');
  const tableObj = new cls(name);
  const className = tableObj.constructor.name;
  // table.__name can be in ctor
  if (!tableObj.__name) {
    tableObj.__name = utils.toSnakeCase(className);
  }
  const cols = tableObj.__columns;
  enumerateColumns(tableObj, (col, colName) => {
    if (!col) {
      throw new Error(`Empty column object at property "${colName}"`);
    }
    if (!isValidColumn(col)) {
      throw new Error(
        `Invalid column at property "${colName}", expected a ColumnBase, got "${toTypeString(
          col,
        )}"`,
      );
    }
    if (col.__type === ColumnBaseType.Joined) {
      throw new Error(
        `Unexpected ${toTypeString(
          col,
        )} at property "${colName}", you should not use JoinedColumn in a table definition, JoinedColumn should be used in SELECT actions`,
      );
    }
    if (col.__type === ColumnBaseType.Selected) {
      throw new Error(
        `Unexpected ${toTypeString(
          col,
        )} at property "${colName}", you should not use SelectedColumn in a table definition, SelectedColumn should be used in SELECT actions`,
      );
    }

    let columnToAdd: ColumnBase;
    if (col.__table) {
      // A foreign column can be detected using any of the following
      // * col.__table is not empty
      // * Object.isFrozen(col)
      // * Additionally, some mutated FKs are of type FKWrapper

      let referenced: Column;
      if (col instanceof FKWrapper) {
        referenced;
      }
      const fc = new ForeignColumn(colName, tableObj, col);
      // tslint:disable-next-line
      (tableObj as any)[colName] = fc;
      columnToAdd = fc;
    } else {
      if (!col.__name) {
        // column name can be set by setName
        col.__name = utils.toSnakeCase(colName);
      }
      col.__table = tableObj;
      // Check if it's a pk
      if (col instanceof Column && (col as Column).props.pk) {
        tableObj.__pks.push(col as Column);
      }
      columnToAdd = col;
    }
    Object.freeze(columnToAdd);
    cols.push(columnToAdd);
  });
  return (tableObj as unknown) as T;
}
