export enum SelectedColumnAttribute {
  // Whether this column is excluded in JSON serialization.
  isPrivate = 1,

  // Whether this column is excluded in JSON serialization if it's empty.
  // NOTE: 0, false, nil, empty string, empty collection are all considered empty values.
  excludeEmptyValue,
}

export enum ColumnAttribute {
  // CREATE TABLE SQL adds extra generated virtual columns for columns with an alias.
  alias,
}

export enum ActionAttribute {
  // Specifies the interface name this action belongs to.
  groupTypeName = 1,

  // Specifies the resulting type name of a SELECT action.
  resultTypeName,

  // Whether this action is private in its belonging scope.
  isPrivate,

  // Ignore `ColumnAttribute.isPrivate` and treat all columns
  // as public.
  ignorePrivateColumns,
}
