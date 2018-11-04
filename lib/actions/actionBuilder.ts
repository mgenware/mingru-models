import { ColumnBase } from 'core/core';
import SelectView from './selectAction';

export class ActionBuilder {
  constructor(
    public name: string,
  ) { }

  select(...columns: ColumnBase[]): SelectView {
    return new SelectView(this.name, columns);
  }
}

export default function action(name: string): ActionBuilder {
  return new ActionBuilder(name);
}
