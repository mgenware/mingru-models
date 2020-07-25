import { SQLCall } from './sqlCall';
import { RawColumn } from '../actions/rawColumn';
import { sql } from './sqlHelper';

declare module './sqlCall' {
  interface SQLCall {
    toColumn(name: string): RawColumn;
  }
}

SQLCall.prototype.toColumn = function (name: string): RawColumn {
  return new RawColumn(sql`${this}`, name);
};
