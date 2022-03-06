export function throwOnEmptyArray<T>(arr: T[] | readonly T[], name: string) {
  if (!arr.length) {
    throw new Error(`The argument ${name} cannot be an empty array`);
  }
}
