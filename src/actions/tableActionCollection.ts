import { ColumnBase, Table } from '../core/core';
import SelectView from './selectAction';
import UpdateAction from './updateAction';
import InsertAction from './insertAction';
import DeleteAction from './deleteAction';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { Action } from './action';
import SelectAction from './selectAction';

export class TableActionCollection {
  map: Map<string, Action> = new Map<string, Action>();

  constructor(public table: Table) {
    throwIfFalsy(table, 'table');
  }

  select(name: string, ...columns: ColumnBase[]): SelectAction {
    return this.selectCore(name, false, columns);
  }

  selectAll(name: string, ...columns: ColumnBase[]): SelectAction {
    return this.selectCore(name, true, columns);
  }

  update(name: string): UpdateAction {
    const action = new UpdateAction(name, this.table, false);
    this.addAction(action);
    return action;
  }

  updateOne(name: string): UpdateAction {
    const action = new UpdateAction(name, this.table, true);
    this.addAction(action);
    return action;
  }

  insert(name: string, ...columns: ColumnBase[]): InsertAction {
    const action = new InsertAction(name, this.table, columns, false);
    this.addAction(action);
    return action;
  }

  insertOne(name: string, ...columns: ColumnBase[]): InsertAction {
    const action = new InsertAction(name, this.table, columns, true);
    this.addAction(action);
    return action;
  }

  delete(name: string): DeleteAction {
    const action = new DeleteAction(name, this.table, false);
    this.addAction(action);
    return action;
  }

  deleteOne(name: string): DeleteAction {
    const action = new DeleteAction(name, this.table, true);
    this.addAction(action);
    return action;
  }

  private selectCore(
    name: string,
    selectAll: boolean,
    columns: ColumnBase[],
  ): SelectView {
    const action = new SelectView(name, this.table, columns, selectAll);
    this.addAction(action);
    return action;
  }

  private addAction(action: Action): Action {
    if (this.map.has(action.name)) {
      throw new Error(`The action "${action.name}" already exists`);
    }
    this.map.set(action.name, action);
    return action;
  }
}

export default function actions(table: Table): TableActionCollection {
  return new TableActionCollection(table);
}
