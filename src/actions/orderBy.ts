import { ColumnBase } from '../core/core';

export default class OrderBy {
  constructor(public column: ColumnBase, public desc = false) {}
}
