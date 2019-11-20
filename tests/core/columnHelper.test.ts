import * as mm from '../../';
import post from '../models/post';
import like from '../models/like';
import * as assert from 'assert';
import user from '../models/user';

const expect = assert.equal;
const ok = assert.ok;

it('bigInt', () => {
  const c = mm.bigInt(123);
  ok(c.type.types.includes(mm.dt.bigInt));
  expect(c.defaultValue, 123);
  expect(c.type.unsigned, false);
});

it('unsignedBigInt', () => {
  const c = mm.uBigInt(123);
  ok(c.type.types.includes(mm.dt.bigInt));
  expect(c.defaultValue, 123);
  expect(c.type.unsigned, true);
});

it('int', () => {
  const c = mm.int(123);
  ok(c.type.types.includes(mm.dt.int));
  expect(c.defaultValue, 123);
  expect(c.type.unsigned, false);
});

it('unsignedInt', () => {
  const c = mm.uInt(123);
  ok(c.type.types.includes(mm.dt.int));
  expect(c.defaultValue, 123);
  expect(c.type.unsigned, true);
});

it('smallInt', () => {
  const c = mm.smallInt(123);
  ok(c.type.types.includes(mm.dt.smallInt));
  expect(c.defaultValue, 123);
  expect(c.type.unsigned, false);
});

it('unsignedSmallInt', () => {
  const c = mm.uSmallInt(123);
  ok(c.type.types.includes(mm.dt.smallInt));
  expect(c.defaultValue, 123);
  expect(c.type.unsigned, true);
});

it('tinyInt', () => {
  const c = mm.tinyInt(123);
  ok(c.type.types.includes(mm.dt.tinyInt));
  expect(c.defaultValue, 123);
  expect(c.type.unsigned, false);
});

it('unsignedTinyInt', () => {
  const c = mm.uTinyInt(123);
  ok(c.type.types.includes(mm.dt.tinyInt));
  expect(c.defaultValue, 123);
  expect(c.type.unsigned, true);
});

it('char', () => {
  const c = mm.char(20, 'ha');
  ok(c.type.types.includes(mm.dt.char));
  expect(c.defaultValue, 'ha');
  expect(c.type.length, 20);
});

it('varChar', () => {
  const c = mm.varChar(20, 'ha');
  ok(c.type.types.includes(mm.dt.varChar));
  expect(c.defaultValue, 'ha');
  expect(c.type.length, 20);
});

it('pk', () => {
  const c = mm.pk();
  ok(c.type.types.includes(mm.dt.bigInt));
  expect(c.type.unique, false);
  expect(c.type.nullable, false);
  expect(c.type.unsigned, true);
  expect(c.type.autoIncrement, true);
});

it('pk(column)', () => {
  const charCol = mm.char(3);
  const c = mm.pk(charCol);
  expect(c, charCol);
  expect(c.type.unique, false);
  expect(c.type.nullable, false);
});

it('pk(FK)', () => {
  const c = mm.pk(post.id);
  expect(c.type.pk, true);
  expect(c.type.unique, false);
  expect(c.type.nullable, false);
  expect(c.type.autoIncrement, false);
  expect(c.foreignColumn, post.id);

  const likeUserID = like.user_id;
  expect(likeUserID.type.pk, true);
  expect(likeUserID.foreignColumn, user.id);
  expect(likeUserID.type.autoIncrement, false);
});

it('autoIncrement', () => {
  expect(mm.pk(mm.int()).type.autoIncrement, false);
  expect(mm.pk(mm.tinyInt()).type.autoIncrement, false);
  expect(mm.pk(mm.bool()).type.autoIncrement, false);
  expect(mm.pk(mm.varChar(3)).type.autoIncrement, false);
  // Set the AUTO_INCREMENT explicitly
  expect(mm.pk(mm.int()).noAutoIncrement.type.autoIncrement, false);
  expect(mm.pk(mm.varChar(3)).autoIncrement.type.autoIncrement, true);
  // FK
  expect(post.user_id.type.autoIncrement, false);
});

it('isNoDefaultOnCSQL', () => {
  expect(mm.pk(mm.int(20)).isNoDefaultOnCSQL, false);
  expect(mm.pk(mm.int(20)).noDefaultOnCSQL.isNoDefaultOnCSQL, true);
});

it('text', () => {
  const c = mm.text('ha');
  ok(c.type.types.includes(mm.dt.text));
  expect(c.defaultValue, 'ha');
});

it('double', () => {
  const c = mm.double(20);
  ok(c.type.types.includes(mm.dt.double));
  expect(c.defaultValue, 20);
});

it('float', () => {
  const c = mm.float(20);
  ok(c.type.types.includes(mm.dt.float));
  expect(c.defaultValue, 20);
});

it('bool', () => {
  const c = mm.bool(true);
  ok(c.type.types.includes(mm.dt.bool));
  expect(c.defaultValue, true);
});

it('datetime', () => {
  let c = mm.datetime();
  ok(c.type.types.includes(mm.dt.datetime));

  c = mm.datetime(true);
  expect(
    (c.defaultValue as object).toString(),
    'SQL(E(SQLCall(0, return = ColType(SQL.DATETIME), type = 3))',
  );
});

it('date', () => {
  let c = mm.date();
  ok(c.type.types.includes(mm.dt.date));

  c = mm.date(true);
  expect(
    (c.defaultValue as object).toString(),
    'SQL(E(SQLCall(1, return = ColType(SQL.DATE), type = 3))',
  );
});

it('time', () => {
  let c = mm.time();
  ok(c.type.types.includes(mm.dt.time));

  c = mm.time(true);
  expect(
    (c.defaultValue as object).toString(),
    'SQL(E(SQLCall(2, return = ColType(SQL.TIME), type = 3))',
  );
});

it('dt.isInteger', () => {
  const { dt } = mm;
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
  const { dt } = mm;
  expect(dt.isNumber(dt.bigInt), true);
  expect(dt.isNumber(dt.int), true);
  expect(dt.isNumber(dt.smallInt), true);
  expect(dt.isNumber(dt.tinyInt), true);
  expect(dt.isNumber(dt.float), true);
  expect(dt.isNumber(dt.double), true);
  expect(dt.isNumber(dt.bool), false);
});

it('dt.isTimeRelated', () => {
  const { dt } = mm;
  expect(dt.isTimeRelated(dt.datetime), true);
  expect(dt.isTimeRelated(dt.date), true);
  expect(dt.isTimeRelated(dt.time), true);
  expect(dt.isTimeRelated(dt.int), false);
});

it('Allow null as default value', () => {
  let c = mm.int(null);
  expect(c.defaultValue, null);
  c = mm.bool(null);
  expect(c.defaultValue, null);
});
