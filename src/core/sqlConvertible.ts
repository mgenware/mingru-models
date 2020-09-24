import { Column } from './core';
import { SQLVariable, SQL } from './sql';
import { SQLCall } from './sqlCall';
import { RawColumn } from '../actions/rawColumn';
import { Action } from '../actions/tableActions';

// Allowed types in `mm.sql`.
type SQLConvertible = string | Column | SQLVariable | SQL | SQLCall | RawColumn | Action;

export default SQLConvertible;
