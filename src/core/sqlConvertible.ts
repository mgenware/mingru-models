import { Column, SQLVariable, SQL, SQLCall, RawColumn } from './core.js';
import { Action } from '../actions/tableActions.js';

// Allowed types in `mm.sql`.
type SQLConvertible = string | Column | SQLVariable | SQL | SQLCall | RawColumn | Action;

export default SQLConvertible;
