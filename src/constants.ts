import { sql } from './core/sqlHelper.js';

export class Constants {
  t = sql`1`;
  f = sql`0`;
}

export default new Constants();
