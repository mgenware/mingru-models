/* eslint-disable no-param-reassign */
import toTypeString from 'to-type-string';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { Table, Column, CoreProperty, JoinedTable } from './core';
import * as defs from './defs';
import Utils from '../lib/utils';
import { SQL } from './sql';

export interface EnumerateColumnsOptions {
  sorted?: boolean;
}

export function enumerateColumns(
  tableObject: Table,
  cb: (column: Column, prop: string) => void,
  opts?: EnumerateColumnsOptions,
): void {
  throwIfFalsy(tableObject, 'tableObject');

  // eslint-disable-next-line no-param-reassign
  opts = opts || {};
  if (!cb) {
    return;
  }

  const entries = Object.entries(tableObject);
  if (opts.sorted) {
    entries.sort((a, b) => Utils.compareStrings(a[0], b[0]));
  }
  for (const pair of entries) {
    const name = pair[0] as string;
    const value = pair[1];
    // Ignore internal props and functions
    if (
      name.startsWith(defs.InternalPropPrefix) ||
      typeof value === 'function'
    ) {
      continue;
    }
    if (value instanceof Column === false) {
      throw new Error(
        `The property "${name}" is not a Column, got "${toTypeString(value)}"`,
      );
    }
    cb(value, name);
  }
}

export function tableCore(
  tableName: string,
  dbName: string | null,
  tableObj: Table | null,
  columns: [string, Column][],
): Table {
  throwIfFalsy(tableName, 'tableName');
  tableObj = tableObj || new Table();
  tableObj.__name = Utils.toSnakeCase(tableName);
  tableObj.__dbName = dbName || null;

  const cols = tableObj.__columns;
  for (const [propName, col] of columns) {
    try {
      if (!col) {
        throw new Error('Expected empty column object');
      }
      if (col.__table instanceof JoinedTable) {
        throw new Error(
          `Unexpected table type "${toTypeString(
            col,
          )}". You should not use JoinedColumn in a table definition, JoinedColumn can only be used in SELECT actions.`,
        );
      }

      let columnToAdd: Column;

      // A frozen column indicates an implicit foreign key.
      // Note: `mm.fk` can set up an explicit foreign key.
      if (Object.isFrozen(col)) {
        // Copy the frozen column
        columnToAdd = Column.newForeignColumn(col, tableObj);
      } else {
        columnToAdd = col;
      }

      // Populate column props
      if (!columnToAdd.__name) {
        // column name can be set by setName
        columnToAdd.__name = Utils.toSnakeCase(propName);
      }
      columnToAdd.__table = tableObj;
      if (columnToAdd.__type.pk) {
        tableObj.__pks.push(col);
        if (columnToAdd.__type.autoIncrement) {
          tableObj.__pkAIs.push(col);
        }
      }

      // Column default value cannot be a complex SQL
      if (
        columnToAdd.__defaultValue &&
        columnToAdd.__defaultValue instanceof SQL &&
        columnToAdd.__defaultValue.hasColumns
      ) {
        throw new Error('Default value cannot be a complex SQL expression');
      }

      cols.push(columnToAdd);
      // eslint-disable-next-line
      (tableObj as any)[propName] = columnToAdd;
      // After all properties are set, run property handlers
      CoreProperty.runHandlers(columnToAdd);

      columnToAdd.freeze();
    } catch (err) {
      err.message += ` [column "${propName}"]`;
      throw err;
    }
  }
  return tableObj;
}

export function table<T extends Table>(
  CLASS: new (name?: string) => T,
  dbName?: string,
): T {
  throwIfFalsy(CLASS, 'CLASS');
  const tableObj = new CLASS();
  const tableName = tableObj.constructor.name;

  const columns: [string, Column][] = [];
  enumerateColumns(tableObj, (col, propName) => {
    columns.push([propName, col]);
  });
  return tableCore(tableName, dbName || null, tableObj, columns) as T;
}
