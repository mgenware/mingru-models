import * as dd from '../../';
import post from '../models/post';
import * as assert from 'assert';

const expect = assert.equal;
const ok = assert.ok;

it('bigInt', () => {
  const c = dd.bigInt(123);
  ok(c.type.types.includes(dd.dt.bigInt));
  expect(c.defaultValue, 123);
  expect(c.type.unsigned, false);
});

it('unsignedBigInt', () => {
  const c = dd.uBigInt(123);
  ok(c.type.types.includes(dd.dt.bigInt));
  expect(c.defaultValue, 123);
  expect(c.type.unsigned, true);
});

it('int', () => {
  const c = dd.int(123);
  ok(c.type.types.includes(dd.dt.int));
  expect(c.defaultValue, 123);
  expect(c.type.unsigned, false);
});

it('unsignedInt', () => {
  const c = dd.uInt(123);
  ok(c.type.types.includes(dd.dt.int));
  expect(c.defaultValue, 123);
  expect(c.type.unsigned, true);
});

it('smallInt', () => {
  const c = dd.smallInt(123);
  ok(c.type.types.includes(dd.dt.smallInt));
  expect(c.defaultValue, 123);
  expect(c.type.unsigned, false);
});

it('unsignedSmallInt', () => {
  const c = dd.uSmallInt(123);
  ok(c.type.types.includes(dd.dt.smallInt));
  expect(c.defaultValue, 123);
  expect(c.type.unsigned, true);
});

it('tinyInt', () => {
  const c = dd.tinyInt(123);
  ok(c.type.types.includes(dd.dt.tinyInt));
  expect(c.defaultValue, 123);
  expect(c.type.unsigned, false);
});

it('unsignedTinyInt', () => {
  const c = dd.uTinyInt(123);
  ok(c.type.types.includes(dd.dt.tinyInt));
  expect(c.defaultValue, 123);
  expect(c.type.unsigned, true);
});

it('char', () => {
  const c = dd.char(20, 'ha');
  ok(c.type.types.includes(dd.dt.char));
  expect(c.defaultValue, 'ha');
  expect(c.type.length, 20);
});

it('varChar', () => {
  const c = dd.varChar(20, 'ha');
  ok(c.type.types.includes(dd.dt.varChar));
  expect(c.defaultValue, 'ha');
  expect(c.type.length, 20);
});

it('pk', () => {
  const c = dd.pk();
  ok(c.type.types.includes(dd.dt.bigInt));
  expect(c.type.unique, false);
  expect(c.type.nullable, false);
  expect(c.type.unsigned, true);
  expect(c.type.autoIncrement, true);
});

it('pk(column)', () => {
  const charCol = dd.char(3);
  const c = dd.pk(charCol);
  expect(c, charCol);
  expect(c.type.unique, false);
  expect(c.type.nullable, false);
});

it('pk(FK)', () => {
  const c = dd.pk(post.id);
  expect(c.type.pk, true);
  expect(c.type.unique, false);
  expect(c.type.nullable, false);
  expect(c.foreignColumn, post.id);
});

it('autoIncrement', () => {
  // Calling pk with an integer type sets AUTO_INCREMENT to true
  expect(dd.pk(dd.int()).type.autoIncrement, true);
  expect(dd.pk(dd.tinyInt()).type.autoIncrement, true);
  expect(dd.pk(dd.bool()).type.autoIncrement, false);
  expect(dd.pk(dd.varChar(3)).type.autoIncrement, false);
  // Set the AUTO_INCREMENT explicitly
  expect(dd.pk(dd.int()).noAutoIncrement.type.autoIncrement, false);
  expect(dd.pk(dd.varChar(3)).autoIncrement.type.autoIncrement, true);
  // FK
  expect(post.user_id.type.autoIncrement, false);
});

it('isNoDefaultOnCSQL', () => {
  expect(dd.pk(dd.int(20)).isNoDefaultOnCSQL, false);
  expect(dd.pk(dd.int(20)).noDefaultOnCSQL.isNoDefaultOnCSQL, true);
});

it('text', () => {
  const c = dd.text('ha');
  ok(c.type.types.includes(dd.dt.text));
  expect(c.defaultValue, 'ha');
});

it('double', () => {
  const c = dd.double(20);
  ok(c.type.types.includes(dd.dt.double));
  expect(c.defaultValue, 20);
});

it('float', () => {
  const c = dd.float(20);
  ok(c.type.types.includes(dd.dt.float));
  expect(c.defaultValue, 20);
});

it('bool', () => {
  const c = dd.bool(true);
  ok(c.type.types.includes(dd.dt.bool));
  expect(c.defaultValue, true);
});

it('datetime', () => {
  let c = dd.datetime();
  ok(c.type.types.includes(dd.dt.datetime));

  c = dd.datetime(true);
  expect((c.defaultValue as object).toString(), 'CALL(0)');
});

it('date', () => {
  let c = dd.date();
  ok(c.type.types.includes(dd.dt.date));

  c = dd.date(true);
  expect((c.defaultValue as object).toString(), 'CALL(1)');
});

it('time', () => {
  let c = dd.time();
  ok(c.type.types.includes(dd.dt.time));

  c = dd.time(true);
  expect((c.defaultValue as object).toString(), 'CALL(2)');
});

it('dt.isInteger', () => {
  const { dt } = dd;
  expect(dt.isInteger(dt.bigInt), true);
  expect(dt.isInteger(dt.int), true);
  expect(dt.isInteger(dt.smallInt), true);
  expect(dt.isInteger(dt.tinyInt), true);
  expect(dt.isInteger(dt.float), false);
  expect(dt.isInteger(dt.double), false);
  expect(dt.isInteger(dt.bool), false);
  expect(dt.isInteger(dt.varChar), false);
  expect(dt.isInteger(dt.char), false);
});

it('dt.isNumber', () => {
  const { dt } = dd;
  expect(dt.isNumber(dt.bigInt), true);
  expect(dt.isNumber(dt.int), true);
  expect(dt.isNumber(dt.smallInt), true);
  expect(dt.isNumber(dt.tinyInt), true);
  expect(dt.isNumber(dt.float), true);
  expect(dt.isNumber(dt.double), true);
  expect(dt.isNumber(dt.bool), false);
});

it('dt.isTimeRelated', () => {
  const { dt } = dd;
  expect(dt.isTimeRelated(dt.datetime), true);
  expect(dt.isTimeRelated(dt.date), true);
  expect(dt.isTimeRelated(dt.time), true);
  expect(dt.isTimeRelated(dt.int), false);
});
