import { throwIfFalsy } from 'throw-if-arg-empty';
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
  TransactionMemberTypes,
  TransactionMember,
  ActionWithReturnValues,
} from './transactAction';

export function select(...columns: SelectActionColumns[]): SelectAction {
  return new SelectAction(columns, SelectActionMode.row);
}

export function selectRows(...columns: SelectActionColumns[]): SelectAction {
  return new SelectAction(columns, SelectActionMode.list);
}

export function selectField(column: SelectActionColumns): SelectAction {
  return new SelectAction([column], SelectActionMode.field);
}

export function selectPage(...columns: SelectActionColumns[]): SelectAction {
  return new SelectAction(columns, SelectActionMode.page);
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

export function transact(...actions: TransactionMemberTypes[]): TransactAction {
  throwIfFalsy(actions, 'actions');
  return new TransactAction(
    actions.map((a) => {
      if (a instanceof TransactionMember) {
        return a;
      }
      if (a instanceof ActionWithReturnValues) {
        return new TransactionMember(a.action, undefined, a.returnValues);
      }
      return new TransactionMember(a);
    }),
  );
}
