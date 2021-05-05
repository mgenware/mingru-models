import { SQL } from './core/core.js';
import { sql } from './core/sqlHelper.js';

export function and(a: SQL, b: SQL): SQL {
  return sql`(${a} AND ${b})`;
}

export function or(a: SQL, b: SQL): SQL {
  return sql`(${a} OR ${b})`;
}
