import { Column, SQLVariable, SQL, SQLCall, RawColumn } from './core';
import { Action } from '../actions/tableActions';

// Allowed types in `mm.sql`.
type SQLConvertible = string | Column | SQLVariable | SQL | SQLCall | RawColumn | Action;

export default SQLConvertible;
