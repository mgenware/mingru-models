/* eslint-disable object-curly-newline */
import { throwOnEmptyArray } from '../lib/arrayUtil.js';
import { UpdateAction } from './updateAction.js';
import { InsertAction } from './insertAction.js';
import { DeleteAction } from './deleteAction.js';
import { SelectAction, SelectedColumnTypes, SelectActionMode } from './selectAction.js';
import {
  TransactAction,
  TransactionMemberTypes,
  TransactionMember,
  ActionWithReturnValues,
} from './transactAction.js';

export function selectRow(...columns: SelectedColumnTypes[]): SelectAction {
  return new SelectAction(columns, SelectActionMode.row);
}

export const select = selectRow;

export function selectRows(...columns: SelectedColumnTypes[]): SelectAction {
  return new SelectAction(columns, SelectActionMode.rowList);
}

export function selectField(column: SelectedColumnTypes): SelectAction {
  return new SelectAction([column], SelectActionMode.field);
}

export function selectFieldRows(column: SelectedColumnTypes): SelectAction {
  return new SelectAction([column], SelectActionMode.fieldList);
}

export function selectExists(): SelectAction {
  return new SelectAction([], SelectActionMode.exists);
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
  throwOnEmptyArray(actions, 'actions');
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
