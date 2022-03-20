import { Column, SQL } from './core.js';
import { param, sql, ParamAttributes } from './sqlHelper.js';
import SQLConvertible from './sqlConvertible.js';

declare module './core.js' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Column {
    toParam(name?: string, opt?: ParamAttributes): SQLVariable;
    toArrayParam(name?: string, opt?: ParamAttributes): SQLVariable;
    isEqualTo(literals: TemplateStringsArray, ...params: SQLConvertible[]): SQL;
    isEqualToSQL(valueSQL: SQL): SQL;
    isEqualToParam(name?: string, opt?: ParamAttributes): SQL;
    isInArrayParam(name?: string, opt?: ParamAttributes): SQL;
    isNotEqualTo(literals: TemplateStringsArray, ...params: SQLConvertible[]): SQL;
    isNotEqualToSQL(valueSQL: SQL): SQL;
    isNotEqualToParam(name?: string, opt?: ParamAttributes): SQL;
    isNull(): SQL;
    isNotNull(): SQL;
  }
}

Column.prototype.toParam = function (name?: string, opt?: ParamAttributes) {
  return param(this, name, { column: this, ...opt });
};

Column.prototype.toArrayParam = function (name?: string, opt?: ParamAttributes) {
  return param(this, name, { isArray: true, column: this, ...opt });
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

Column.prototype.isEqualToParam = function (name?: string, opt?: ParamAttributes) {
  return this.isEqualToSQL(sql`${this.toParam(name, opt)}`);
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

Column.prototype.isNotEqualToParam = function (name?: string, opt?: ParamAttributes) {
  return this.isNotEqualToSQL(sql`${this.toParam(name, opt)}`);
};

Column.prototype.isNull = function () {
  return sql`${this} IS ${null}`;
};

Column.prototype.isNotNull = function () {
  return sql`${this} IS NOT ${null}`;
};

Column.prototype.isInArrayParam = function (name?: string, opt?: ParamAttributes) {
  return sql`${this} IN ${this.toArrayParam(name, opt)}`;
};
