import { UpdateAction } from './updateAction';
import { InsertAction } from './insertAction';
import { DeleteAction } from './deleteAction';
import {
  SelectAction,
  SelectActionColumns,
  SelectActionMode,
} from './selectAction';
import {
  TransactAction,
  TransactionMemberHelper,
  TransactionMember,
} from './transactAction';
import { throwIfFalsy } from 'throw-if-arg-empty';

export function select(...columns: SelectActionColumns[]): SelectAction {
  return new SelectAction(columns, SelectActionMode.row);
}

export function selectRows(...columns: SelectActionColumns[]): SelectAction {
  return new SelectAction(columns, SelectActionMode.list);
}

export function selectField(column: SelectActionColumns): SelectAction {
  return new SelectAction([column], SelectActionMode.field);
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
  return new InsertAction(false);
}

export function insertOne(): InsertAction {
  return new InsertAction(true);
}

export function unsafeInsert(): InsertAction {
  return new InsertAction(false, true);
}

export function unsafeInsertOne(): InsertAction {
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

export function transact(
  ...actions: TransactionMemberHelper[]
): TransactAction {
  throwIfFalsy(actions, 'actions');
  const converted = actions.map(a =>
    a instanceof TransactionMember ? a : new TransactionMember(a),
  );
  return new TransactAction(converted);
}
