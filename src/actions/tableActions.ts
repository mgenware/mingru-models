/* eslint-disable no-param-reassign */
import mustBeErr from 'must-be-err';
import { ActionAttribute } from '../attrs.js';
import { Table, SQLVariable } from '../core/core.js';
import * as constants from '../constants.js';
import * as su from '../lib/stringUtil.js';

export interface TableActionOptions {
  // Make table configurable by an param with the given name.
  configurableTableName?: string;
}

export interface TableActionsData {
  table: Table;
  actions: Readonly<Record<string, Action | undefined>>;
  options: TableActionOptions;
}

export class TableActions {
  protected __data!: TableActionsData;

  __getData(): TableActionsData {
    return this.__data;
  }

  __configure(
    table: Table,
    actions: Readonly<Record<string, Action | undefined>>,
    options: TableActionOptions | undefined,
  ) {
    this.__data = {
      table,
      actions,
      options: options ?? {},
    };
  }
}

export enum ActionType {
  select,
  insert,
  update,
  delete,
  transact,
  wrap,
}

export interface ActionData {
  actionType?: ActionType;
  // Will be set after calling `mm.tableActions`.
  name?: string;
  // Set by `from()`.
  sqlTable?: Table;
  // Will be set after calling `mm.tableActions`.
  groupTable?: Table;
  argStubs?: SQLVariable[];
  attrs?: Map<ActionAttribute, unknown>;
}

export class Action {
  protected __data: ActionData = {};

  __getData(): ActionData {
    return this.__data;
  }

  constructor(actionType: ActionType) {
    this.__data.actionType = actionType;
  }

  from(table: Table): this {
    this.__data.sqlTable = table;
    return this;
  }

  argStubs(...args: SQLVariable[]): this {
    this.__data.argStubs = args;
    return this;
  }

  // `groupTable` the one from `validate`.
  // Returns the table this action applies to.
  // `__sqlTable` has the highest precedence, and can be set by `from`.
  // If `from` is not called, which is the usual case, it tries to grab one
  // from `__groupTable`, which is the containing table when an action is
  // initialized from `mm.tableActions`.
  // Finally, for inline actions (if `from` is not called), it can use the
  // `groupTable` from `validate` method.
  __mustGetAvailableSQLTable(groupTable: Table | undefined | null): Table {
    const table = this.__data.sqlTable || this.__data.groupTable || groupTable;
    if (!table) {
      throw new Error(`Action "${this}" doesn't have any tables`);
    }
    return table;
  }

  __mustGetGroupTable(): Table {
    const table = this.__data.groupTable;
    if (!table) {
      throw new Error(`Action "${this}" doesn't have a group table`);
    }
    return table;
  }

  __mustGetName(): string {
    if (!this.__data.name) {
      throw new Error(`Action "${this}" doesn't have a name`);
    }
    return this.__data.name;
  }

  attr(name: ActionAttribute, value: unknown): this {
    this.mustGetAttrs().set(name, value);
    return this;
  }

  privateAttr(): this {
    return this.attr(ActionAttribute.isPrivate, true);
  }

  resultTypeNameAttr(resultTypeName: string): this {
    return this.attr(ActionAttribute.resultTypeName, resultTypeName);
  }

  toString(): string {
    const d = this.__data;
    return su.desc(this, d.name, { t: d.groupTable?.toString(), ft: d.sqlTable?.toString() });
  }

  // Automatically called by `mm.tableActions` for all the columns it walks through.
  // Actions are immutable. Actions touched by `mm.tableActions` will have `__groupTable`
  // and `__name` set.
  // Other actions, such as ones embedded in SQL exprs are ignored by `ta.tableActions`,
  // thus have to be manually taken care of. You should always use
  // `this.mustGetAvailableSQLTable(groupTable)` in `validate`, and use the result value for
  // action SQL validation.
  // If we need to call `validate` on child components (e.g. a TRANSACT action), pass down the
  // `groupTable` param of `validate`.
  // eslint-disable-next-line class-methods-use-this
  __validate(_groupTable: Table) {
    // Implemented by subclass.
  }

  // Called by `ta.tableActions`.
  __configure(groupTable: Table, name: string) {
    if (!this.__data.name) {
      this.__data.name = name;
    }
    if (!this.__data.groupTable) {
      this.__data.groupTable = groupTable;
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    this.__validate(this.__data.groupTable ?? groupTable);
  }

  private mustGetAttrs(): Map<ActionAttribute, unknown> {
    return (this.__data.attrs ??= new Map<ActionAttribute, unknown>());
  }
}

export class EmptyAction extends Action {
  // eslint-disable-next-line class-methods-use-this
  initActionData(): ActionData {
    return {};
  }
}

// An empty action is ignored in `enumerateActions`.
export const emptyAction = new EmptyAction(ActionType.select);

function enumerateActions<T extends TableActions>(
  ta: T,
  cb: (action: Action, prop: string) => void,
) {
  for (const pair of Object.entries(ta)) {
    const name = pair[0];
    const value = pair[1] as unknown;
    // Ignore internal props and functions.
    if (name.startsWith(constants.internalPropPrefix)) {
      continue;
    }
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    if (value instanceof Action && value !== emptyAction) {
      cb(value, name);
    }
  }
}

export function tableActionsCore(
  table: Table,
  tableActionsObj: TableActions | null,
  actions: Record<string, Action | undefined>,
  options: TableActionOptions | undefined,
): TableActions {
  tableActionsObj = tableActionsObj || new TableActions();
  for (const [name, action] of Object.entries(actions)) {
    try {
      action?.__configure(table, name);
    } catch (err) {
      mustBeErr(err);
      err.message += ` [action "${name}"]`;
      throw err;
    }
  }
  tableActionsObj.__configure(table, actions, options);
  return tableActionsObj;
}

export function tableActions<T extends Table, A extends TableActions>(
  table: T,
  TACls: new () => A,
  options?: TableActionOptions,
): A {
  try {
    const taObj = new TACls();
    const actions: Record<string, Action | undefined> = {};
    enumerateActions(taObj, (action, name) => {
      actions[name] = action;
    });
    return tableActionsCore(table, taObj, actions, options) as A;
  } catch (err) {
    mustBeErr(err);
    err.message += ` [table "${table}"]`;
    throw err;
  }
}
