import { Table } from '../core/core';
import UpdateAction from './updateAction';
import InsertAction from './insertAction';
import DeleteAction from './deleteAction';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { Action } from './action';
import { SelectAction, SelectActionColumns } from './selectAction';

export class TableActionCollection<T extends Table> {
  map: Map<string, Action> = new Map<string, Action>();

  constructor(public table: T) {
    throwIfFalsy(table, 'table');
  }

  select(name: string, ...columns: SelectActionColumns[]): SelectAction<T> {
    return this.selectCore(name, false, columns);
  }

  selectAll(name: string, ...columns: SelectActionColumns[]): SelectAction<T> {
    return this.selectCore(name, true, columns);
  }

  selectField(name: string, column: SelectActionColumns): SelectAction<T> {
    throwIfFalsy(column, 'column');
    const action = this.select(name, column);
    action.isSelectField = true;
    return action;
  }

  update(name: string): UpdateAction {
    return this.addAction(new UpdateAction(name, this.table, false, false));
  }

  updateOne(name: string): UpdateAction {
    return this.addAction(new UpdateAction(name, this.table, false, true));
  }

  updateAll(name: string): UpdateAction {
    return this.addAction(new UpdateAction(name, this.table, true, false));
  }

  insert(name: string): InsertAction {
    return this.addAction(new InsertAction(name, this.table, false, false));
  }

  insertOne(name: string): InsertAction {
    return this.addAction(new InsertAction(name, this.table, true, false));
  }

  insertWithDefaults(name: string): InsertAction {
    return this.addAction(new InsertAction(name, this.table, false, true));
  }

  insertOneWithDefaults(name: string): InsertAction {
    return this.addAction(new InsertAction(name, this.table, true, true));
  }

  delete(name: string): DeleteAction {
    return this.addAction(new DeleteAction(name, this.table, false, false));
  }

  deleteOne(name: string): DeleteAction {
    return this.addAction(new DeleteAction(name, this.table, false, true));
  }

  deleteAll(name: string): DeleteAction {
    return this.addAction(new DeleteAction(name, this.table, true, false));
  }

  private selectCore(
    name: string,
    selectAll: boolean,
    cols: SelectActionColumns[],
  ): SelectAction<T> {
    const action = new SelectAction(name, this.table, cols, selectAll);
    this.addAction(action);
    return action;
  }

  private addAction<A extends Action>(action: A): A {
    if (this.map.has(action.name)) {
      throw new Error(`The action "${action.name}" already exists`);
    }
    this.map.set(action.name, action);
    return action;
  }
}

export default function actions<T extends Table>(
  table: T,
): TableActionCollection<T> {
  return new TableActionCollection(table);
}
