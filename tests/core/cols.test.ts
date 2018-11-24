import * as dd from '../../';

test('bigInt', () => {
  const c = dd.bigInt(123);
  expect(c.types).toContain(dd.dt.bigInt);
  expect(c.default).toBe(123);
  expect(c.unsigned).toBe(false);
});

test('unsignedBigInt', () => {
  const c = dd.unsignedBigInt(123);
  expect(c.types).toContain(dd.dt.bigInt);
  expect(c.default).toBe(123);
  expect(c.unsigned).toBe(true);
});

test('int', () => {
  const c = dd.int(123);
  expect(c.types).toContain(dd.dt.int);
  expect(c.default).toBe(123);
  expect(c.unsigned).toBe(false);
});

test('unsignedInt', () => {
  const c = dd.unsignedInt(123);
  expect(c.types).toContain(dd.dt.int);
  expect(c.default).toBe(123);
  expect(c.unsigned).toBe(true);
});

test('smallInt', () => {
  const c = dd.smallInt(123);
  expect(c.types).toContain(dd.dt.smallInt);
  expect(c.default).toBe(123);
  expect(c.unsigned).toBe(false);
});

test('unsignedSmallInt', () => {
  const c = dd.unsignedSmallInt(123);
  expect(c.types).toContain(dd.dt.smallInt);
  expect(c.default).toBe(123);
  expect(c.unsigned).toBe(true);
});

test('tinyInt', () => {
  const c = dd.tinyInt(123);
  expect(c.types).toContain(dd.dt.tinyInt);
  expect(c.default).toBe(123);
  expect(c.unsigned).toBe(false);
});

test('unsignedTinyInt', () => {
  const c = dd.unsignedTinyInt(123);
  expect(c.types).toContain(dd.dt.tinyInt);
  expect(c.default).toBe(123);
  expect(c.unsigned).toBe(true);
});

test('char', () => {
  const c = dd.char(20, 'ha');
  expect(c.types).toContain(dd.dt.char);
  expect(c.default).toBe('ha');
  expect(c.length).toBe(20);
});

test('varChar', () => {
  const c = dd.varChar(20, 'ha');
  expect(c.types).toContain(dd.dt.varChar);
  expect(c.default).toBe('ha');
  expect(c.length).toBe(20);
});

test('pk', () => {
  const c = dd.pk();
  expect(c.types).toContain(dd.dt.bigInt);
  expect(c.unique).toBe(true);
  expect(c.notNull).toBe(true);
});

test('pk(column)', () => {
  const charCol = dd.char(3);
  const c = dd.pk(charCol);
  expect(c).toBe(charCol);
  expect(c.unique).toBe(true);
  expect(c.notNull).toBe(true);
});

test('null (default)', () => {
  const c = dd.int(123);
  expect(c.notNull).toBe(false);
});

test('notNull', () => {
  const c = dd.notNull(dd.int(123));
  expect(c.notNull).toBe(true);
});
