import { Column, SQL } from './core.js';
import { input, sql, InputAttributes } from './sqlHelper.js';
import SQLConvertible from './sqlConvertible.js';

declare module './core.js' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Column {
    toInput(name?: string, opt?: InputAttributes): SQLVariable;
    toArrayInput(name?: string, opt?: InputAttributes): SQLVariable;
    isEqualTo(literals: TemplateStringsArray, ...params: SQLConvertible[]): SQL;
    isEqualToSQL(valueSQL: SQL): SQL;
    isEqualToInput(name?: string, opt?: InputAttributes): SQL;
    isInArrayInput(name?: string, opt?: InputAttributes): SQL;
    isNotEqualTo(literals: TemplateStringsArray, ...params: SQLConvertible[]): SQL;
    isNotEqualToSQL(valueSQL: SQL): SQL;
    isNotEqualToInput(name?: string, opt?: InputAttributes): SQL;
    isNull(): SQL;
    isNotNull(): SQL;
  }
}

Column.prototype.toInput = function (name?: string, opt?: InputAttributes) {
  return input(this, name, { column: this, ...opt });
};

Column.prototype.toArrayInput = function (name?: string, opt?: InputAttributes) {
  return input(this, name, { isArray: true, column: this, ...opt });
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

Column.prototype.isEqualToInput = function (name?: string, opt?: InputAttributes) {
  return this.isEqualToSQL(sql`${this.toInput(name, opt)}`);
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

Column.prototype.isNotEqualToInput = function (name?: string, opt?: InputAttributes) {
  return this.isNotEqualToSQL(sql`${this.toInput(name, opt)}`);
};

Column.prototype.isNull = function () {
  return sql`${this} IS NULL`;
};

Column.prototype.isNotNull = function () {
  return sql`${this} IS NOT NULL`;
};

Column.prototype.isInArrayInput = function (name?: string, opt?: InputAttributes) {
  return sql`${this} IN ${this.toArrayInput(name, opt)}`;
};
