import { Column } from './core';
import { SQLVariable, SQL } from './sql';
import { SQLCall } from './sqlCall';
import { RawColumn } from '../actions/rawColumn';

// Allowed types in mm.sql template strings
type SQLConvertible = string | Column | SQLVariable | SQL | SQLCall | RawColumn;

export default SQLConvertible;
