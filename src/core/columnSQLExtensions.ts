import { Column } from './core';
import { SQL, SQLVariable } from './sql';
import { input, sql } from './sqlHelper';
import SQLConvertible from './sqlConvertible';

declare module './core' {
  interface Column {
    toInput(name?: string): SQLVariable;
    toArrayInput(name?: string): SQLVariable;
    isEqualTo(literals: TemplateStringsArray, ...params: SQLConvertible[]): SQL;
    isEqualToSQL(valueSQL: SQL): SQL;
    isEqualToInput(name?: string): SQL;
    isInArrayInput(name?: string): SQL;
    isNotEqualTo(literals: TemplateStringsArray, ...params: SQLConvertible[]): SQL;
    isNotEqualToSQL(valueSQL: SQL): SQL;
    isNotEqualToInput(name?: string): SQL;
    isNull(): SQL;
    isNotNull(): SQL;
  }
}

Column.prototype.toInput = function (name?: string) {
  return input(this, name, undefined, this);
};

Column.prototype.toArrayInput = function (name?: string) {
  return input(this, name, true, this);
};

Column.prototype.isEqualToSQL = function (valueSQL: SQL) {
  return sql`${this} = ${valueSQL}`;
};

Column.prototype.isEqualTo = function (
  literals: TemplateStringsArray,
  ...params: SQLConvertible[]
) {
  return this.isEqualToSQL(sql(literals, ...params));
};

Column.prototype.isEqualToInput = function (name?: string) {
  return this.isEqualToSQL(sql`${this.toInput(name)}`);
};

Column.prototype.isNotEqualToSQL = function (valueSQL: SQL) {
  return sql`${this} <> ${valueSQL}`;
};

Column.prototype.isNotEqualTo = function (
  literals: TemplateStringsArray,
  ...params: SQLConvertible[]
) {
  return this.isNotEqualToSQL(sql(literals, ...params));
};

Column.prototype.isNotEqualToInput = function (name?: string) {
  return this.isNotEqualToSQL(sql`${this.toInput(name)}`);
};

Column.prototype.isNull = function () {
  return sql`${this} IS NULL`;
};

Column.prototype.isNotNull = function () {
  return sql`${this} IS NOT NULL`;
};

Column.prototype.isInArrayInput = function (name?: string) {
  return sql`${this} IN (${this.toArrayInput(name)})`;
};
