import { throwIfFalsy } from 'throw-if-arg-empty';
import { Table, Column } from './core';
import { utils } from '../main';
import toTypeString from 'to-type-string';
import * as defs from './defs';

export function enumerateColumns(
  tableObject: Table,
  cb: (column: Column, prop: string) => void,
) {
  throwIfFalsy(tableObject, 'tableObject');
  if (!cb) {
    return;
  }

  for (const pair of Object.entries(tableObject)) {
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
        `The property "${name}" is not a Column object, got "${toTypeString(
          value,
        )}"`,
      );
    }
    const col = value as Column;
    cb(col, name);
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
  enumerateColumns(tableObj, (col, propName) => {
    if (!col) {
      throw new Error(`Expected empty column object at property "${propName}"`);
    }
    if (col.props.isJoinedColumn()) {
      throw new Error(
        `Unexpected ${toTypeString(
          col,
        )} at property "${propName}", you should not use JoinedColumn in a table definition, JoinedColumn should be used in SELECT actions`,
      );
    }

    let columnToAdd: Column;
    // A frozen column indicates an implicit foreign key, note: `dd.fk` can set up an explicit foreign key
    if (Object.isFrozen(col)) {
      // Copy the frozen column
      columnToAdd = Column.spawn(col);
      columnToAdd.props.foreignColumn = col;
      // Reset column name to current prop name instead of inherited name
      columnToAdd.props.name = propName;
    } else {
      columnToAdd = col;
    }

    // Populate column props
    const { props } = columnToAdd;
    if (!props.name) {
      // column name can be set by setName
      props.name = utils.toSnakeCase(propName);
    }
    props.table = tableObj;
    // Check if it's a pk
    if (props.pk) {
      tableObj.__pks.push(col);
    }

    // tslint:disable-next-line
    (tableObj as any)[propName] = columnToAdd;
    Object.freeze(columnToAdd);
    cols.push(columnToAdd);
  });
  return (tableObj as unknown) as T;
}
