import { Column } from './core';
import { SQL, SQLInput, input, sql } from './sql';

declare module './core' {
  interface Column {
    toInput(name?: string): SQLInput;
    isEqualTo(valueSQL: SQL): SQL;
    isEqualToInput(name?: string): SQL;
    isNotEqualTo(valueSQL: SQL): SQL;
    isNotEqualToInput(name?: string): SQL;
    isNull(): SQL;
    isNotNull(): SQL;
  }
}

Column.prototype.toInput = function(name?: string) {
  return input(this, name);
};

Column.prototype.isEqualTo = function(valueSQL: SQL) {
  return sql`${this} = ${valueSQL}`;
};

Column.prototype.isEqualToInput = function(name?: string) {
  return this.isEqualTo(sql`${this.toInput(name)}`);
};

Column.prototype.isNotEqualTo = function(valueSQL: SQL) {
  return sql`${this} <> ${valueSQL}`;
};

Column.prototype.isNotEqualToInput = function(name?: string) {
  return this.isNotEqualTo(sql`${this.toInput(name)}`);
};

Column.prototype.isNull = function() {
  return sql`${this} IS NULL`;
};

Column.prototype.isNotNull = function() {
  return sql`${this} IS NOT NULL`;
};
