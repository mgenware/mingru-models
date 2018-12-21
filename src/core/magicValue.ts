export enum MagicValueType {
  now,
}

export class MagicValue {
  constructor(public type: MagicValueType) {}
}

export function now() {
  return new MagicValue(MagicValueType.now);
}
