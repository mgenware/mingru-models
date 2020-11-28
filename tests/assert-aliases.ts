import * as assert from 'assert';

export const eq: <T>(actual: T, expected: T) => asserts actual is T = assert.strictEqual;
export const notEq = assert.notStrictEqual;
export const deepEq: <T>(actual: T, expected: T) => asserts actual is T = assert.deepStrictEqual;
export const notDeepEq = assert.notDeepStrictEqual;
// eslint-disable-next-line prefer-destructuring
export const ok: (actual: unknown) => asserts actual = assert.ok;
