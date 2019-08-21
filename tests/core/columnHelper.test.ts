import * as dd from '../../';
import post from '../models/post';

it('bigInt', () => {
  const c = dd.bigInt(123);
  expect(c.type.types).toContain(dd.dt.bigInt);
  expect(c.defaultValue).toBe(123);
  expect(c.type.unsigned).toBe(false);
});

it('unsignedBigInt', () => {
  const c = dd.uBigInt(123);
  expect(c.type.types).toContain(dd.dt.bigInt);
  expect(c.defaultValue).toBe(123);
  expect(c.type.unsigned).toBe(true);
});

it('int', () => {
  const c = dd.int(123);
  expect(c.type.types).toContain(dd.dt.int);
  expect(c.defaultValue).toBe(123);
  expect(c.type.unsigned).toBe(false);
});

it('unsignedInt', () => {
  const c = dd.uInt(123);
  expect(c.type.types).toContain(dd.dt.int);
  expect(c.defaultValue).toBe(123);
  expect(c.type.unsigned).toBe(true);
});

it('smallInt', () => {
  const c = dd.smallInt(123);
  expect(c.type.types).toContain(dd.dt.smallInt);
  expect(c.defaultValue).toBe(123);
  expect(c.type.unsigned).toBe(false);
});

it('unsignedSmallInt', () => {
  const c = dd.uSmallInt(123);
  expect(c.type.types).toContain(dd.dt.smallInt);
  expect(c.defaultValue).toBe(123);
  expect(c.type.unsigned).toBe(true);
});

it('tinyInt', () => {
  const c = dd.tinyInt(123);
  expect(c.type.types).toContain(dd.dt.tinyInt);
  expect(c.defaultValue).toBe(123);
  expect(c.type.unsigned).toBe(false);
});

it('unsignedTinyInt', () => {
  const c = dd.uTinyInt(123);
  expect(c.type.types).toContain(dd.dt.tinyInt);
  expect(c.defaultValue).toBe(123);
  expect(c.type.unsigned).toBe(true);
});

it('char', () => {
  const c = dd.char(20, 'ha');
  expect(c.type.types).toContain(dd.dt.char);
  expect(c.defaultValue).toBe('ha');
  expect(c.type.length).toBe(20);
});

it('varChar', () => {
  const c = dd.varChar(20, 'ha');
  expect(c.type.types).toContain(dd.dt.varChar);
  expect(c.defaultValue).toBe('ha');
  expect(c.type.length).toBe(20);
});

it('pk', () => {
  const c = dd.pk();
  expect(c.type.types).toContain(dd.dt.bigInt);
  expect(c.type.unique).toBe(false);
  expect(c.type.nullable).toBe(false);
  expect(c.type.unsigned).toBe(true);
  expect(c.type.autoIncrement).toBe(true);
});

it('pk(column)', () => {
  const charCol = dd.char(3);
  const c = dd.pk(charCol);
  expect(c).toBe(charCol);
  expect(c.type.unique).toBe(false);
  expect(c.type.nullable).toBe(false);
});

it('pk(FK)', () => {
  const c = dd.pk(post.id);
  expect(c.type.pk).toBe(true);
  expect(c.type.unique).toBe(false);
  expect(c.type.nullable).toBe(false);
  expect(c.foreignColumn).toBe(post.id);
});

it('autoIncrement', () => {
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

it('isNoDefaultOnCSQL', () => {
  expect(dd.pk(dd.int(20)).isNoDefaultOnCSQL).toBe(false);
  expect(dd.pk(dd.int(20)).noDefaultOnCSQL.isNoDefaultOnCSQL).toBe(true);
});

it('text', () => {
  const c = dd.text('ha');
  expect(c.type.types).toContain(dd.dt.text);
  expect(c.defaultValue).toBe('ha');
});

it('double', () => {
  const c = dd.double(20);
  expect(c.type.types).toContain(dd.dt.double);
  expect(c.defaultValue).toBe(20);
});

it('float', () => {
  const c = dd.float(20);
  expect(c.type.types).toContain(dd.dt.float);
  expect(c.defaultValue).toBe(20);
});

it('bool', () => {
  const c = dd.bool(true);
  expect(c.type.types).toContain(dd.dt.bool);
  expect(c.defaultValue).toBe(true);
});

it('datetime', () => {
  let c = dd.datetime();
  expect(c.type.types).toContain(dd.dt.datetime);

  c = dd.datetime(true);
  expect((c.defaultValue as object).toString()).toBe('CALL(0)');
});

it('date', () => {
  let c = dd.date();
  expect(c.type.types).toContain(dd.dt.date);

  c = dd.date(true);
  expect((c.defaultValue as object).toString()).toBe('CALL(1)');
});

it('time', () => {
  let c = dd.time();
  expect(c.type.types).toContain(dd.dt.time);

  c = dd.time(true);
  expect((c.defaultValue as object).toString()).toBe('CALL(2)');
});

it('dt.isInteger', () => {
  const { dt } = dd;
  expect(dt.isInteger(dt.bigInt)).toBe(true);
  expect(dt.isInteger(dt.int)).toBe(true);
  expect(dt.isInteger(dt.smallInt)).toBe(true);
  expect(dt.isInteger(dt.tinyInt)).toBe(true);
  expect(dt.isInteger(dt.float)).toBe(false);
  expect(dt.isInteger(dt.double)).toBe(false);
  expect(dt.isInteger(dt.bool)).toBe(false);
  expect(dt.isInteger(dt.varChar)).toBe(false);
  expect(dt.isInteger(dt.char)).toBe(false);
});

it('dt.isNumber', () => {
  const { dt } = dd;
  expect(dt.isNumber(dt.bigInt)).toBe(true);
  expect(dt.isNumber(dt.int)).toBe(true);
  expect(dt.isNumber(dt.smallInt)).toBe(true);
  expect(dt.isNumber(dt.tinyInt)).toBe(true);
  expect(dt.isNumber(dt.float)).toBe(true);
  expect(dt.isNumber(dt.double)).toBe(true);
  expect(dt.isNumber(dt.bool)).toBe(false);
});

it('dt.isTimeRelated', () => {
  const { dt } = dd;
  expect(dt.isTimeRelated(dt.datetime)).toBe(true);
  expect(dt.isTimeRelated(dt.date)).toBe(true);
  expect(dt.isTimeRelated(dt.time)).toBe(true);
  expect(dt.isTimeRelated(dt.int)).toBe(false);
});
