/* eslint-disable no-param-reassign */
import mustBeErr from 'must-be-err';
import { Table, Column, JoinTable } from './core.js';
import * as constants from '../constants.js';
import * as su from '../lib/stringUtil.js';

function enumerateColumns(tableObject: Table, cb: (column: Column, prop: string) => void): void {
  for (const pair of Object.entries(tableObject)) {
    const name = pair[0];
    const value = pair[1] as unknown;
    // Ignore internal props and functions.
    if (name.startsWith(constants.internalPropPrefix)) {
      continue;
    }
    if (value instanceof Column) {
      cb(value, name);
    }
  }
}

export interface TableOptions {
  dbName?: string;
  virtualTable?: boolean;
}

export function tableCore(
  tableName: string,
  tableObj: Table | undefined,
  columns: Record<string, Column | undefined>,
  opt?: TableOptions,
): Table {
  try {
    tableObj = tableObj || new Table();
    tableName = su.toSnakeCase(tableName);
    const pks: Column[] = [];
    const aiPKs: Column[] = [];

    const convertedColumns: Record<string, Column | undefined> = {};
    for (const [propName, col] of Object.entries(columns)) {
      try {
        if (!col) {
          throw new Error('Expected empty column object');
        }
        if (col.__getData().table instanceof JoinTable) {
          throw new Error(
            `Unexpected table type "${col}". You should not use JoinedColumn in a table definition, JoinedColumn can only be used in SELECT actions.`,
          );
        }

        let columnToAdd: Column;

        // A frozen column indicates an implicit foreign key.
        // Note: `mm.fk` can set up an explicit foreign key.
        if (Object.isFrozen(col)) {
          // Copy the frozen column.
          columnToAdd = Column.newForeignColumn(col);
        } else {
          columnToAdd = col;
        }

        columnToAdd.__configure(su.toSnakeCase(propName), tableObj);
        if (columnToAdd.__type().pk) {
          pks.push(col);
          if (columnToAdd.__type().autoIncrement) {
            aiPKs.push(col);
          }
        }

        convertedColumns[propName] = columnToAdd;
        // eslint-disable-next-line
        (tableObj as any)[propName] = columnToAdd;

        columnToAdd.__freeze();
      } catch (err) {
        mustBeErr(err);
        err.message += ` [column "${propName}"]`;
        throw err;
      }
    }

    tableObj.__configure(tableName, opt?.dbName, convertedColumns, pks, aiPKs, !!opt?.virtualTable);
    return tableObj;
  } catch (topErr) {
    mustBeErr(topErr);
    topErr.message += ` [table "${tableName}"]`;
    throw topErr;
  }
}

export function table<T extends Table>(CLASS: new (name?: string) => T, opt?: TableOptions): T {
  const tableObj = new CLASS();
  const tableName = tableObj.constructor.name;

  const columns: Record<string, Column | undefined> = {};
  enumerateColumns(tableObj, (col, propName) => {
    columns[propName] = col;
  });
  return tableCore(tableName, tableObj, columns, opt) as T;
}

// A ghost table is a table that is used to create a TA for grouping a set of
// table actions from other tables.
// The table itself does not contain any columns.
// Unlike an empty `Table` subclass, `GhostTable` should be recognized by
// converters, for example, mingru will not generate CREATE TABLE SQL for a
// ghost table.
export class GhostTable extends Table {}

export const ghostTable = table(GhostTable);
