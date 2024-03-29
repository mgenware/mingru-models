/* eslint-disable no-param-reassign */
import mustBeErr from 'must-be-err';
import { ActionAttribute } from '../attrs.js';
import { Table, SQLVariable } from '../core/core.js';
import * as constants from '../constants.js';
import * as su from '../lib/stringUtil.js';

export interface ActionGroupData {
  name: string;
  groupTable: Table;
  actions: Readonly<Record<string, Action | undefined>>;
}

export class ActionGroup {
  protected __data!: ActionGroupData;

  __getData(): ActionGroupData {
    return this.__data;
  }

  __configure(
    name: string,
    groupTable: Table,
    actions: Readonly<Record<string, Action | undefined>>,
  ) {
    this.__data = {
      name,
      groupTable,
      actions,
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
  // Will be set in `mm.actionGroup`.
  name?: string;
  // Set by `from()`.
  sqlTable?: Table;
  // Will be set in `mm.actionGroup`.
  actionGroup?: ActionGroup;
  argStubs?: SQLVariable[];
  attrs?: Map<ActionAttribute, unknown>;
  inline?: boolean;
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

  __mustGetAvailableSQLTable(fallback?: Table): Table {
    const table =
      this.__data.sqlTable ?? this.__data.actionGroup?.__getData().groupTable ?? fallback;
    if (!table) {
      throw new Error(`Action "${this}" doesn't belong to any tables`);
    }
    return table;
  }

  __mustGetActionGroup(): ActionGroup {
    const ag = this.__data.actionGroup;
    if (!ag) {
      throw new Error(`Action "${this}" doesn't belong to any action groups`);
    }
    return ag;
  }

  __getGroupTable(): Table | null {
    return this.__data.actionGroup?.__getData().groupTable ?? null;
  }

  __mustGetGroupTable(): Table {
    return this.__mustGetActionGroup().__getData().groupTable;
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
    return su.desc(this, d.name, {
      t: d.actionGroup?.__getData().groupTable.toString(),
      ft: d.sqlTable?.toString(),
    });
  }

  // eslint-disable-next-line class-methods-use-this
  __validate(_table: Table) {
    // Implemented by subclasses.
  }

  // Called by `ag.actionGroup`.
  // `inline`: true for inner actions in WRAP or TRANSACT actions.
  __configure(name: string, ag: ActionGroup, inline: boolean) {
    const d = this.__data;
    if (d.name) {
      return;
    }
    d.name = name;
    d.actionGroup = ag;
    d.inline = inline;
    this.__validate(d.sqlTable ?? ag.__getData().groupTable);
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

function enumerateActions<T extends ActionGroup>(
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

export function actionGroupCore(
  table: Table,
  actionGroupInput: ActionGroup | string,
  actions: Record<string, Action | undefined>,
): ActionGroup {
  let userAGName: string | undefined;
  let ag: ActionGroup;
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (!actionGroupInput) {
    ag = new ActionGroup();
  } else if (typeof actionGroupInput === 'string') {
    ag = new ActionGroup();
    userAGName = actionGroupInput;
  } else {
    ag = actionGroupInput;
  }
  const agName = userAGName ?? ag.constructor.name;
  ag.__configure(agName, table, actions);
  for (const [name, action] of Object.entries(actions)) {
    try {
      action?.__configure(name, ag, false);
    } catch (err) {
      mustBeErr(err);
      err.message += ` [action "${name}"]`;
      throw err;
    }
  }
  return ag;
}

export function actionGroup<T extends Table, A extends ActionGroup>(
  table: T,
  TACls: new () => A,
): A {
  try {
    const taObj = new TACls();
    const actions: Record<string, Action | undefined> = {};
    enumerateActions(taObj, (action, name) => {
      actions[name] = action;
    });
    return actionGroupCore(table, taObj, actions) as A;
  } catch (err) {
    mustBeErr(err);
    err.message += ` [table "${table}"]`;
    throw err;
  }
}
