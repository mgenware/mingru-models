import * as mm from '../../';
import post from '../models/post';
import like from '../models/like';
import * as assert from 'assert';
import user from '../models/user';

const expect = assert.equal;
const ok = assert.ok;

it('bigInt', () => {
  const c = mm.bigInt(20);
  ok(c.__type.types.includes(mm.dt.bigInt));
  expect(c.__type.length, 20);
  expect(c.__type.unsigned, false);
});

it('unsignedBigInt', () => {
  const c = mm.uBigInt(20);
  ok(c.__type.types.includes(mm.dt.bigInt));
  expect(c.__type.length, 20);
  expect(c.__type.unsigned, true);
});

it('int', () => {
  const c = mm.int(20);
  ok(c.__type.types.includes(mm.dt.int));
  expect(c.__type.length, 20);
  expect(c.__type.unsigned, false);

  const c2 = mm.int();
  expect(c2.__type.length, 0);
});

it('unsignedInt', () => {
  const c = mm.uInt(20);
  ok(c.__type.types.includes(mm.dt.int));
  expect(c.__type.length, 20);
  expect(c.__type.unsigned, true);
});

it('smallInt', () => {
  const c = mm.smallInt(20);
  ok(c.__type.types.includes(mm.dt.smallInt));
  expect(c.__type.length, 20);
  expect(c.__type.unsigned, false);
});

it('unsignedSmallInt', () => {
  const c = mm.uSmallInt(20);
  ok(c.__type.types.includes(mm.dt.smallInt));
  expect(c.__type.length, 20);
  expect(c.__type.unsigned, true);
});

it('tinyInt', () => {
  const c = mm.tinyInt(20);
  ok(c.__type.types.includes(mm.dt.tinyInt));
  expect(c.__type.length, 20);
  expect(c.__type.unsigned, false);
});

it('unsignedTinyInt', () => {
  const c = mm.uTinyInt(20);
  ok(c.__type.types.includes(mm.dt.tinyInt));
  expect(c.__type.length, 20);
  expect(c.__type.unsigned, true);
});

it('char', () => {
  const c = mm.char(20);
  ok(c.__type.types.includes(mm.dt.char));
  expect(c.__type.length, 20);
  expect(c.__type.unsigned, false);
});

it('varChar', () => {
  const c = mm.varChar(20);
  ok(c.__type.types.includes(mm.dt.varChar));
  expect(c.__type.length, 20);
  expect(c.__type.unsigned, false);
});

it('binary', () => {
  const c = mm.binary(20);
  ok(c.__type.types.includes(mm.dt.binary));
  expect(c.__type.length, 20);
  expect(c.__type.unsigned, false);
});

it('varBinary', () => {
  const c = mm.varBinary(20);
  ok(c.__type.types.includes(mm.dt.varBinary));
  expect(c.__type.length, 20);
  expect(c.__type.unsigned, false);
});

it('pk', () => {
  const c = mm.pk();
  ok(c.__type.types.includes(mm.dt.bigInt));
  expect(c.__type.unique, false);
  expect(c.__type.nullable, false);
  expect(c.__type.unsigned, true);
  expect(c.__type.autoIncrement, true);
});

it('pk(column)', () => {
  const charCol = mm.char(3);
  const c = mm.pk(charCol);
  expect(c, charCol);
  expect(c.__type.unique, false);
  expect(c.__type.nullable, false);
});

it('pk(FK)', () => {
  const c = mm.pk(post.id);
  expect(c.__type.pk, true);
  expect(c.__type.unique, false);
  expect(c.__type.nullable, false);
  expect(c.__type.autoIncrement, false);
  expect(c.__foreignColumn, post.id);

  const likeUserID = like.user_id;
  expect(likeUserID.__type.pk, true);
  expect(likeUserID.__foreignColumn, user.id);
  expect(likeUserID.__type.autoIncrement, false);
});

it('autoIncrement', () => {
  expect(mm.pk(mm.int()).__type.autoIncrement, false);
  expect(mm.pk(mm.tinyInt()).__type.autoIncrement, false);
  expect(mm.pk(mm.bool()).__type.autoIncrement, false);
  expect(mm.pk(mm.varChar(3)).__type.autoIncrement, false);
  // Set the AUTO_INCREMENT explicitly
  expect(mm.pk(mm.int()).noAutoIncrement.__type.autoIncrement, false);
  expect(mm.pk(mm.varChar(3)).autoIncrement.__type.autoIncrement, true);
  // FK
  expect(post.user_id.__type.autoIncrement, false);
});

it('isNoDefaultOnCSQL', () => {
  expect(mm.pk(mm.int(20)).__isNoDefaultOnCSQL, false);
  expect(mm.pk(mm.int(20)).noDefaultOnCSQL.__isNoDefaultOnCSQL, true);
});

it('text', () => {
  const c = mm.text();
  ok(c.__type.types.includes(mm.dt.text));
  expect(c.__type.length, 0);
  expect(c.__type.unsigned, false);
});

it('double', () => {
  const c = mm.double(20);
  ok(c.__type.types.includes(mm.dt.double));
  expect(c.__type.length, 20);
  expect(c.__type.unsigned, false);

  const c2 = mm.double();
  expect(c2.__type.length, 0);
});

it('float', () => {
  const c = mm.float(20);
  ok(c.__type.types.includes(mm.dt.float));
  expect(c.__type.length, 20);
  expect(c.__type.unsigned, false);
});

it('bool', () => {
  const c = mm.bool();
  ok(c.__type.types.includes(mm.dt.bool));
  expect(c.__type.unsigned, false);
});

it('datetime', () => {
  let c = mm.datetime();
  ok(c.__type.types.includes(mm.dt.datetime));

  c = mm.datetime('local');
  expect(
    (c.__defaultValue as object).toString(),
    'SQL(E(SQLCall(0, return = ColType(SQL.DATETIME), type = 3))',
  );

  c = mm.datetime('utc');
  expect(
    (c.__defaultValue as object).toString(),
    'SQL(E(SQLCall(16, return = ColType(SQL.DATETIME), type = 3))',
  );
});

it('date', () => {
  let c = mm.date();
  ok(c.__type.types.includes(mm.dt.date));

  c = mm.date('local');
  expect(
    (c.__defaultValue as object).toString(),
    'SQL(E(SQLCall(1, return = ColType(SQL.DATE), type = 3))',
  );

  c = mm.date('utc');
  expect(
    (c.__defaultValue as object).toString(),
    'SQL(E(SQLCall(17, return = ColType(SQL.DATE), type = 3))',
  );
});

it('time', () => {
  let c = mm.time();
  ok(c.__type.types.includes(mm.dt.time));

  c = mm.time('local');
  expect(
    (c.__defaultValue as object).toString(),
    'SQL(E(SQLCall(2, return = ColType(SQL.TIME), type = 3))',
  );

  c = mm.time('utc');
  expect(
    (c.__defaultValue as object).toString(),
    'SQL(E(SQLCall(18, return = ColType(SQL.TIME), type = 3))',
  );
});

it('decimal', () => {
  const c = mm.decimal(5, 2);
  ok(c.__type.types.includes(mm.dt.decimal));
  expect(c.__type.length, 5);
  expect(c.__type.extraLength, 2);
  expect(c.__type.unsigned, false);
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
  expect(dt.isInteger(dt.decimal), false);
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
  expect(dt.isNumber(dt.decimal), true);
});

it('dt.isTimeRelated', () => {
  const { dt } = mm;
  expect(dt.isTimeRelated(dt.datetime), true);
  expect(dt.isTimeRelated(dt.date), true);
  expect(dt.isTimeRelated(dt.time), true);
  expect(dt.isTimeRelated(dt.int), false);
  expect(dt.isTimeRelated(dt.decimal), false);
  expect(dt.isTimeRelated(dt.varChar), false);
});

it('Allow null as default value', () => {
  let c = mm.int();
  expect(c.__defaultValue, undefined);
  c = mm.bool();
  expect(c.__defaultValue, undefined);
});
