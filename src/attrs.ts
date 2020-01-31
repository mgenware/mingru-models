export enum ColumnAttributes {
  // Whether this column is excluded in JSON serialization.
  isPrivate = '_is_private',

  // Whether this column is excluded in JSON serialization if it's empty.
  // NOTE: 0, false, nil, empty string, empty collection are all considered empty values.
  excludeEmptyValue = '_exclude_empty',
}

export enum ActionAttributes {
  // Specifies the interface name this action belongs to.
  groupTypeName = '_group_type_name',

  // Specifies the resulting type name of a SELECT action.
  resultTypeName = '_result_type_name',
}
