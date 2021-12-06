import { SQLCall, SelectedColumn } from './core.js';
import { sql } from './sqlHelper.js';

declare module './core.js' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface SQLCall {
    toColumn(name: string): SelectedColumn;
  }
}

SQLCall.prototype.toColumn = function (name: string): SelectedColumn {
  return new SelectedColumn(sql`${this}`, name);
};
