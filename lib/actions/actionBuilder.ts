import { ColumnBase, Table } from 'core/core';
import SelectView from './selectAction';
import UpdateAction from './updateAction';

export class ActionBuilder {
  constructor(
    public name: string,
  ) { }

  select(...columns: ColumnBase[]): SelectView {
    return new SelectView(this.name, columns);
  }

  update(table: Table): UpdateAction {
    return new UpdateAction(this.name, table);
  }
}

export default function action(name: string): ActionBuilder {
  return new ActionBuilder(name);
}
