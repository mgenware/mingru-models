import { SQLCall, RawColumn } from './core';
import { sql } from './sqlHelper';

declare module './core' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface SQLCall {
    toColumn(name: string): RawColumn;
  }
}

SQLCall.prototype.toColumn = function (name: string): RawColumn {
  return new RawColumn(sql`${this}`, name);
};
