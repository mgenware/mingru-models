import * as dd from '../../';
import post from '../models/post';

test('bigInt', () => {
  const c = dd.bigInt(123);
  expect(c.type.types).toContain(dd.dt.bigInt);
  expect(c.defaultValue).toBe(123);
  expect(c.type.unsigned).toBe(false);
});

test('unsignedBigInt', () => {
  const c = dd.uBigInt(123);
  expect(c.type.types).toContain(dd.dt.bigInt);
  expect(c.defaultValue).toBe(123);
  expect(c.type.unsigned).toBe(true);
});

test('int', () => {
  const c = dd.int(123);
  expect(c.type.types).toContain(dd.dt.int);
  expect(c.defaultValue).toBe(123);
  expect(c.type.unsigned).toBe(false);
});

test('unsignedInt', () => {
  const c = dd.uInt(123);
  expect(c.type.types).toContain(dd.dt.int);
  expect(c.defaultValue).toBe(123);
  expect(c.type.unsigned).toBe(true);
});

test('smallInt', () => {
  const c = dd.smallInt(123);
  expect(c.type.types).toContain(dd.dt.smallInt);
  expect(c.defaultValue).toBe(123);
  expect(c.type.unsigned).toBe(false);
});

test('unsignedSmallInt', () => {
  const c = dd.uSmallInt(123);
  expect(c.type.types).toContain(dd.dt.smallInt);
  expect(c.defaultValue).toBe(123);
  expect(c.type.unsigned).toBe(true);
});

test('tinyInt', () => {
  const c = dd.tinyInt(123);
  expect(c.type.types).toContain(dd.dt.tinyInt);
  expect(c.defaultValue).toBe(123);
  expect(c.type.unsigned).toBe(false);
});

test('unsignedTinyInt', () => {
  const c = dd.uTinyInt(123);
  expect(c.type.types).toContain(dd.dt.tinyInt);
  expect(c.defaultValue).toBe(123);
  expect(c.type.unsigned).toBe(true);
});

test('char', () => {
  const c = dd.char(20, 'ha');
  expect(c.type.types).toContain(dd.dt.char);
  expect(c.defaultValue).toBe('ha');
  expect(c.type.length).toBe(20);
});

test('varChar', () => {
  const c = dd.varChar(20, 'ha');
  expect(c.type.types).toContain(dd.dt.varChar);
  expect(c.defaultValue).toBe('ha');
  expect(c.type.length).toBe(20);
});

test('pk', () => {
  const c = dd.pk();
  expect(c.type.types).toContain(dd.dt.bigInt);
  expect(c.type.unique).toBe(false);
  expect(c.type.nullable).toBe(false);
  expect(c.type.unsigned).toBe(true);
  expect(c.type.autoIncrement).toBe(true);
});

test('pk(column)', () => {
  const charCol = dd.char(3);
  const c = dd.pk(charCol);
  expect(c).toBe(charCol);
  expect(c.type.unique).toBe(false);
  expect(c.type.nullable).toBe(false);
});

test('autoIncrement', () => {
  // Calling pk with an integer type sets AUTO_INCREMENT to true
  expect(dd.pk(dd.int()).type.autoIncrement).toBe(true);
  expect(dd.pk(dd.tinyInt()).type.autoIncrement).toBe(true);
  expect(dd.pk(dd.bool()).type.autoIncrement).toBe(false);
  expect(dd.pk(dd.varChar(3)).type.autoIncrement).toBe(false);
  // Set the AUTO_INCREMENT explicitly
  expect(dd.pk(dd.int()).noAutoIncrement.type.autoIncrement).toBe(false);
  expect(dd.pk(dd.varChar(3)).autoIncrement.type.autoIncrement).toBe(true);
  // FK
  expect(post.user_id.type.autoIncrement).toBe(false);
});

test('text', () => {
  const c = dd.text('ha');
  expect(c.type.types).toContain(dd.dt.text);
  expect(c.defaultValue).toBe('ha');
});

test('double', () => {
  const c = dd.double(20);
  expect(c.type.types).toContain(dd.dt.double);
  expect(c.defaultValue).toBe(20);
});

test('float', () => {
  const c = dd.float(20);
  expect(c.type.types).toContain(dd.dt.float);
  expect(c.defaultValue).toBe(20);
});

test('bool', () => {
  const c = dd.bool(true);
  expect(c.type.types).toContain(dd.dt.bool);
  expect(c.defaultValue).toBe(true);
});

test('datetime', () => {
  let c = dd.datetime();
  expect(c.type.types).toContain(dd.dt.datetime);

  c = dd.datetime(true);
  expect((c.defaultValue as object).toString()).toBe('CALL(0)');
});

test('date', () => {
  let c = dd.date();
  expect(c.type.types).toContain(dd.dt.date);

  c = dd.date(true);
  expect((c.defaultValue as object).toString()).toBe('CALL(1)');
});

test('time', () => {
  let c = dd.time();
  expect(c.type.types).toContain(dd.dt.time);

  c = dd.time(true);
  expect((c.defaultValue as object).toString()).toBe('CALL(2)');
});

test('dt.isInteger', () => {
  const { dt } = dd;
  expect(dt.isInteger(dt.bigInt)).toBe(true);
  expect(dt.isInteger(dt.int)).toBe(true);
  expect(dt.isInteger(dt.smallInt)).toBe(true);
  expect(dt.isInteger(dt.tinyInt)).toBe(true);
  expect(dt.isInteger(dt.bool)).toBe(false);
  expect(dt.isInteger(dt.varChar)).toBe(false);
  expect(dt.isInteger(dt.char)).toBe(false);
});
