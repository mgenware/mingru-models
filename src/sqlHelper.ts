import { SQL, sql } from './core/sql';

export function and(a: SQL, b: SQL): SQL {
  return sql`${a} AND ${b}`;
}

export function or(a: SQL, b: SQL): SQL {
  return sql`${a} OR ${b}`;
}
