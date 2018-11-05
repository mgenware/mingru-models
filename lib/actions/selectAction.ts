import { throwIfFalsy } from 'throw-if-arg-empty';
import { Action } from './action';
import { Table, ColumnBase } from 'core/core';
import { ExprParam } from './expr';
import Expr from './expr';

export default class SelectAction extends Action {
  fromTable: Table|null = null;
  whereExpr: Expr|null = null;

  constructor(name: string, columns: ColumnBase[]) {
    super(name);
    throwIfFalsy(columns, 'columns');
  }

  from(table: Table): SelectAction {
    throwIfFalsy(table, 'table');
    if (this.fromTable) {
      throw new Error('"from" is called twice');
    }
    this.fromTable = table;
    return this;
  }

  where(literals: TemplateStringsArray, ...columns: ExprParam[]): SelectAction {
    if (this.whereExpr) {
      throw new Error('"where" is called twice');
    }
    this.whereExpr = new Expr(literals, columns);
    return this;
  }
}
