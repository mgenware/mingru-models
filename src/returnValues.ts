export enum ReturnValueSrc {
  // Preset return value names start with `__`.
  result = '__result',
  rowsAffected = '__rowsAffected',
  insertedID = '__insertedID',
}

export enum ReturnValueDest {
  atomicOperValue = 'mrOperVal',
}
