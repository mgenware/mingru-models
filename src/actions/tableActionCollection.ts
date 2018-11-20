import { ColumnBase, Table } from '../core/core';
import SelectView from './selectAction';
import UpdateAction from './updateAction';
import InsertAction from './insertAction';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { Action } from './action';

export class TableActionCollection {
  map: Map<string, Action> = new Map<string, Action>();

  constructor(
    public table: Table,
  ) {
    throwIfFalsy(table, 'table');
  }

  select(name: string, ...columns: ColumnBase[]): SelectView {
    const action = new SelectView(name, this.table, columns);
    this.addAction(action);
    return action;
  }

  update(name: string): UpdateAction {
    const action = new UpdateAction(name, this.table);
    this.addAction(action);
    return action;
  }

  insert(name: string): InsertAction {
    const action = new InsertAction(name, this.table);
    this.addAction(action);
    return action;
  }

  private addAction(action: Action) {
    if (this.map.has(action.name)) {
      throw new Error(`The action "${action.name}" already exists`);
    }
    this.map.set(action.name, action);
  }
}

export default function actions(table: Table): TableActionCollection {
  return new TableActionCollection(table);
}
