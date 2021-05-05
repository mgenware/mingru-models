import { SQLCall, RawColumn } from './core.js';
import { sql } from './sqlHelper.js';

declare module './core.js' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface SQLCall {
    toColumn(name: string): RawColumn;
  }
}

SQLCall.prototype.toColumn = function (name: string): RawColumn {
  return new RawColumn(sql`${this}`, name);
};
