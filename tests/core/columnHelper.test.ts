import * as assert from 'assert';
import * as mm from '../..';
import post from '../models/post';
import like from '../models/like';
import user from '../models/user';

const eq = assert.equal;

it('bigInt', () => {
  const c = mm.bigInt(20);
  assert.ok(c.__type.types.includes(mm.dt.bigInt));
  eq(c.__type.length, 20);
  eq(c.__type.unsigned, false);
});

it('unsignedBigInt', () => {
  const c = mm.uBigInt(20);
  assert.ok(c.__type.types.includes(mm.dt.bigInt));
  eq(c.__type.length, 20);
  eq(c.__type.unsigned, true);
});

it('int', () => {
  const c = mm.int(20);
  assert.ok(c.__type.types.includes(mm.dt.int));
  eq(c.__type.length, 20);
  eq(c.__type.unsigned, false);

  const c2 = mm.int();
  eq(c2.__type.length, 0);
});

it('unsignedInt', () => {
  const c = mm.uInt(20);
  assert.ok(c.__type.types.includes(mm.dt.int));
  eq(c.__type.length, 20);
  eq(c.__type.unsigned, true);
});

it('smallInt', () => {
  const c = mm.smallInt(20);
  assert.ok(c.__type.types.includes(mm.dt.smallInt));
  eq(c.__type.length, 20);
  eq(c.__type.unsigned, false);
});

it('unsignedSmallInt', () => {
  const c = mm.uSmallInt(20);
  assert.ok(c.__type.types.includes(mm.dt.smallInt));
  eq(c.__type.length, 20);
  eq(c.__type.unsigned, true);
});

it('tinyInt', () => {
  const c = mm.tinyInt(20);
  assert.ok(c.__type.types.includes(mm.dt.tinyInt));
  eq(c.__type.length, 20);
  eq(c.__type.unsigned, false);
});

it('unsignedTinyInt', () => {
  const c = mm.uTinyInt(20);
  assert.ok(c.__type.types.includes(mm.dt.tinyInt));
  eq(c.__type.length, 20);
  eq(c.__type.unsigned, true);
});

it('char', () => {
  const c = mm.char(20);
  assert.ok(c.__type.types.includes(mm.dt.char));
  eq(c.__type.length, 20);
  eq(c.__type.unsigned, false);
});

it('varChar', () => {
  const c = mm.varChar(20);
  assert.ok(c.__type.types.includes(mm.dt.varChar));
  eq(c.__type.length, 20);
  eq(c.__type.unsigned, false);
});

it('binary', () => {
  const c = mm.binary(20);
  assert.ok(c.__type.types.includes(mm.dt.binary));
  eq(c.__type.length, 20);
  eq(c.__type.unsigned, false);
});

it('varBinary', () => {
  const c = mm.varBinary(20);
  assert.ok(c.__type.types.includes(mm.dt.varBinary));
  eq(c.__type.length, 20);
  eq(c.__type.unsigned, false);
});

it('pk', () => {
  const c = mm.pk();
  assert.ok(c.__type.types.includes(mm.dt.bigInt));
  eq(c.__type.unique, false);
  eq(c.__type.nullable, false);
  eq(c.__type.unsigned, true);
  eq(c.__type.autoIncrement, true);
});

it('pk(column)', () => {
  const charCol = mm.char(3);
  const c = mm.pk(charCol);
  eq(c, charCol);
  eq(c.__type.unique, false);
  eq(c.__type.nullable, false);
});

it('pk(FK)', () => {
  const c = mm.pk(post.id);
  eq(c.__type.pk, true);
  eq(c.__type.unique, false);
  eq(c.__type.nullable, false);
  eq(c.__type.autoIncrement, false);
  eq(c.__foreignColumn, post.id);

  const likeUserID = like.user_id;
  eq(likeUserID.__type.pk, true);
  eq(likeUserID.__foreignColumn, user.id);
  eq(likeUserID.__type.autoIncrement, false);
});

it('autoIncrement', () => {
  eq(mm.pk(mm.int()).__type.autoIncrement, false);
  eq(mm.pk(mm.tinyInt()).__type.autoIncrement, false);
  eq(mm.pk(mm.bool()).__type.autoIncrement, false);
  eq(mm.pk(mm.varChar(3)).__type.autoIncrement, false);
  // Set the AUTO_INCREMENT explicitly
  eq(mm.pk(mm.int()).noAutoIncrement.__type.autoIncrement, false);
  eq(mm.pk(mm.varChar(3)).autoIncrement.__type.autoIncrement, true);
  // FK
  eq(post.user_id.__type.autoIncrement, false);
});

it('isNoDefaultOnCSQL', () => {
  eq(mm.pk(mm.int(20)).__isNoDefaultOnCSQL, false);
  eq(mm.pk(mm.int(20)).noDefaultOnCSQL.__isNoDefaultOnCSQL, true);
});

it('text', () => {
  const c = mm.text();
  assert.ok(c.__type.types.includes(mm.dt.text));
  eq(c.__type.length, 0);
  eq(c.__type.unsigned, false);
});

it('double', () => {
  const c = mm.double(20);
  assert.ok(c.__type.types.includes(mm.dt.double));
  eq(c.__type.length, 20);
  eq(c.__type.unsigned, false);

  const c2 = mm.double();
  eq(c2.__type.length, 0);
});

it('float', () => {
  const c = mm.float(20);
  assert.ok(c.__type.types.includes(mm.dt.float));
  eq(c.__type.length, 20);
  eq(c.__type.unsigned, false);
});

it('bool', () => {
  const c = mm.bool();
  assert.ok(c.__type.types.includes(mm.dt.bool));
  eq(c.__type.unsigned, false);
});

it('datetime', () => {
  let c = mm.datetime();
  assert.ok(c.__type.types.includes(mm.dt.datetime));

  c = mm.datetime('local');
  eq(
    `${c.__defaultValue}`,
    'SQL(E(SQLCall(0, return = ColType(SQL.DATETIME), type = 3))',
  );

  c = mm.datetime('utc');
  eq(
    `${c.__defaultValue}`,
    'SQL(E(SQLCall(16, return = ColType(SQL.DATETIME), type = 3))',
  );
});

it('date', () => {
  let c = mm.date();
  assert.ok(c.__type.types.includes(mm.dt.date));

  c = mm.date('local');
  eq(
    `${c.__defaultValue}`,
    'SQL(E(SQLCall(1, return = ColType(SQL.DATE), type = 3))',
  );

  c = mm.date('utc');
  eq(
    `${c.__defaultValue}`,
    'SQL(E(SQLCall(17, return = ColType(SQL.DATE), type = 3))',
  );
});

it('time', () => {
  let c = mm.time();
  assert.ok(c.__type.types.includes(mm.dt.time));

  c = mm.time('local');
  eq(
    `${c.__defaultValue}`,
    'SQL(E(SQLCall(2, return = ColType(SQL.TIME), type = 3))',
  );

  c = mm.time('utc');
  eq(
    `${c.__defaultValue}`,
    'SQL(E(SQLCall(18, return = ColType(SQL.TIME), type = 3))',
  );
});

it('timestamp', () => {
  let c = mm.timestamp();
  assert.ok(c.__type.types.includes(mm.dt.timestamp));

  c = mm.timestamp(true);
  eq(
    `${c.__defaultValue}`,
    'SQL(E(SQLCall(19, return = ColType(SQL.TIMESTAMP), type = 3))',
  );
});

it('decimal', () => {
  const c = mm.decimal(5, 2);
  assert.ok(c.__type.types.includes(mm.dt.decimal));
  eq(c.__type.length, 5);
  eq(c.__type.extraLength, 2);
  eq(c.__type.unsigned, false);
});

it('dt.isInteger', () => {
  const { dt } = mm;
  eq(dt.isInteger(dt.bigInt), true);
  eq(dt.isInteger(dt.int), true);
  eq(dt.isInteger(dt.smallInt), true);
  eq(dt.isInteger(dt.tinyInt), true);
  eq(dt.isInteger(dt.float), false);
  eq(dt.isInteger(dt.double), false);
  eq(dt.isInteger(dt.bool), false);
  eq(dt.isInteger(dt.varChar), false);
  eq(dt.isInteger(dt.char), false);
  eq(dt.isInteger(dt.decimal), false);
});

it('dt.isNumber', () => {
  const { dt } = mm;
  eq(dt.isNumber(dt.bigInt), true);
  eq(dt.isNumber(dt.int), true);
  eq(dt.isNumber(dt.smallInt), true);
  eq(dt.isNumber(dt.tinyInt), true);
  eq(dt.isNumber(dt.float), true);
  eq(dt.isNumber(dt.double), true);
  eq(dt.isNumber(dt.bool), false);
  eq(dt.isNumber(dt.decimal), true);
});

it('dt.isTimeRelated', () => {
  const { dt } = mm;
  eq(dt.isTimeRelated(dt.datetime), true);
  eq(dt.isTimeRelated(dt.date), true);
  eq(dt.isTimeRelated(dt.time), true);
  eq(dt.isTimeRelated(dt.int), false);
  eq(dt.isTimeRelated(dt.decimal), false);
  eq(dt.isTimeRelated(dt.varChar), false);
});

it('Allow null as default value', () => {
  let c = mm.int();
  eq(c.__defaultValue, undefined);
  c = mm.bool();
  eq(c.__defaultValue, undefined);
});
