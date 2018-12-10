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

  selectField(name: string, column: ColumnBase): SelectAction {
    throwIfFalsy(column, 'column');
    const action = this.select(name, column);
    action.isSelectField = true;
    return action;
  }

  update(name: string): UpdateAction {
    return this.addAction(new UpdateAction(name, this.table, false));
  }

  updateOne(name: string): UpdateAction {
    return this.addAction(new UpdateAction(name, this.table, true));
  }

  insert(name: string): InsertAction {
    return this.addAction(new InsertAction(name, this.table, false));
  }

  insertOne(name: string): InsertAction {
    return this.addAction(new InsertAction(name, this.table, true));
  }

  delete(name: string): DeleteAction {
    return this.addAction(new DeleteAction(name, this.table, false));
  }

  deleteOne(name: string): DeleteAction {
    return this.addAction(new DeleteAction(name, this.table, true));
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

  private addAction<T extends Action>(action: T): T {
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
