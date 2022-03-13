import { Column, SQLVariable, SQL, SQLCall, SelectedColumn } from './core.js';
import { Action } from '../actions/actionGroup.js';

// Allowed types in `mm.sql`.
type SQLConvertible =
  | string
  | Column
  | SQLVariable
  | SQL
  | SQLCall
  | SelectedColumn
  | Action
  | null;

export default SQLConvertible;
