import { ColumnBase } from 'core/core';
import SelectView from './selectView';

export class ViewBuilder {
  constructor(
    public name: string,
  ) { }

  select(...columns: ColumnBase[]): SelectView {
    return new SelectView(this.name, columns);
  }
}

export default function view(name: string): ViewBuilder {
  return new ViewBuilder(name);
}
