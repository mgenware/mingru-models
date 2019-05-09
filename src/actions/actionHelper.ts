import UpdateAction from './updateAction';
import InsertAction from './insertAction';
import DeleteAction from './deleteAction';
import { SelectAction, SelectActionColumns } from './selectAction';
import { Action } from './ta';
import TransactAction from './transactAction';

function selectCore(all: boolean, cols: SelectActionColumns[]): SelectAction {
  const action = new SelectAction(cols, all);
  return action;
}

export function select(...columns: SelectActionColumns[]): SelectAction {
  return selectCore(false, columns);
}

export function selectAll(...columns: SelectActionColumns[]): SelectAction {
  return selectCore(true, columns);
}

export function selectField(column: SelectActionColumns): SelectAction {
  const action = select(column);
  action.isSelectField = true;
  return action;
}

export function unsafeUpdateAll(): UpdateAction {
  return new UpdateAction(true, false);
}

export function updateOne(): UpdateAction {
  return new UpdateAction(false, true);
}

export function updateSome(): UpdateAction {
  return new UpdateAction(false, false);
}

export function insert(): InsertAction {
  return new InsertAction(false, false);
}

export function insertOne(): InsertAction {
  return new InsertAction(true, false);
}

export function insertWithDefaults(): InsertAction {
  return new InsertAction(false, true);
}

export function insertOneWithDefaults(): InsertAction {
  return new InsertAction(true, true);
}

export function deleteSome(): DeleteAction {
  return new DeleteAction(false, false);
}

export function deleteOne(): DeleteAction {
  return new DeleteAction(false, true);
}

export function unsafeDeleteAll(): DeleteAction {
  return new DeleteAction(true, false);
}

export function transact(...actions: Action[]): TransactAction {
  return new TransactAction(actions);
}
