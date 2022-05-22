import * as mm from '../../dist/main.js';
import post from '../models/post.js';
import like from '../models/like.js';
import user from '../models/user.js';
import { eq, ok } from '../assert-aliases.js';

it('bigInt', () => {
  const t = mm.bigInt(20).__type();
  ok(t.types.includes(mm.dt.bigInt));
  eq(t.length, 20);
  eq(t.unsigned, false);
});

it('unsignedBigInt', () => {
  const t = mm.uBigInt(20).__type();
  ok(t.types.includes(mm.dt.bigInt));
  eq(t.length, 20);
  eq(t.unsigned, true);
});

it('int', () => {
  const t = mm.int(20).__type();
  ok(t.types.includes(mm.dt.int));
  eq(t.length, 20);
  eq(t.unsigned, false);

  const t2 = mm.int().__type();
  eq(t2.length, 0);
});

it('unsignedInt', () => {
  const t = mm.uInt(20).__type();
  ok(t.types.includes(mm.dt.int));
  eq(t.length, 20);
  eq(t.unsigned, true);
});

it('smallInt', () => {
  const t = mm.smallInt(20).__type();
  ok(t.types.includes(mm.dt.smallInt));
  eq(t.length, 20);
  eq(t.unsigned, false);
});

it('unsignedSmallInt', () => {
  const t = mm.uSmallInt(20).__type();
  ok(t.types.includes(mm.dt.smallInt));
  eq(t.length, 20);
  eq(t.unsigned, true);
});

it('tinyInt', () => {
  const t = mm.tinyInt(20).__type();
  ok(t.types.includes(mm.dt.tinyInt));
  eq(t.length, 20);
  eq(t.unsigned, false);
});

it('unsignedTinyInt', () => {
  const t = mm.uTinyInt(20).__type();
  ok(t.types.includes(mm.dt.tinyInt));
  eq(t.length, 20);
  eq(t.unsigned, true);
});

it('char', () => {
  const t = mm.char(20).__type();
  ok(t.types.includes(mm.dt.char));
  eq(t.length, 20);
  eq(t.unsigned, false);
});

it('varChar', () => {
  const t = mm.varChar(20).__type();
  ok(t.types.includes(mm.dt.varChar));
  eq(t.length, 20);
  eq(t.unsigned, false);
});

it('binary', () => {
  const t = mm.binary(20).__type();
  ok(t.types.includes(mm.dt.binary));
  eq(t.length, 20);
  eq(t.unsigned, false);
});

it('varBinary', () => {
  const t = mm.varBinary(20).__type();
  ok(t.types.includes(mm.dt.varBinary));
  eq(t.length, 20);
  eq(t.unsigned, false);
});

it('pk', () => {
  const t = mm.pk().__type();
  ok(t.types.includes(mm.dt.bigInt));
  eq(t.nullable, false);
  eq(t.unsigned, true);
  eq(t.autoIncrement, true);
});

it('pk(column)', () => {
  const charCol = mm.char(3);
  const c = mm.pk(charCol);
  eq(c, charCol);

  const t = c.__type();
  eq(t.nullable, false);
});

it('pk(FK)', () => {
  const c = mm.pk(post.id);
  const t = c.__type();
  eq(t.pk, true);
  eq(t.nullable, false);
  eq(t.autoIncrement, false);
  eq(c.__getData().foreignColumn, post.id);

  const likeUserID = like.user_id;
  const t2 = likeUserID.__type();
  eq(t2.pk, true);
  eq(likeUserID.__getData().foreignColumn, user.id);
  eq(t2.autoIncrement, false);
});

it('autoIncrement', () => {
  eq(mm.pk(mm.int()).__type().autoIncrement, false);
  eq(mm.pk(mm.tinyInt()).__type().autoIncrement, false);
  eq(mm.pk(mm.bool()).__type().autoIncrement, false);
  eq(mm.pk(mm.varChar(3)).__type().autoIncrement, false);
  // Set the AUTO_INCREMENT explicitly
  eq(mm.pk(mm.int()).noAutoIncrement.__type().autoIncrement, false);
  eq(mm.pk(mm.varChar(3)).autoIncrement.__type().autoIncrement, true);
  // FK
  eq(post.user_id.__type().autoIncrement, false);
});

it('isNoDefaultValueOnCSQL', () => {
  eq(mm.pk(mm.int(20)).__getData().noDefaultValueOnCSQL, undefined);
  eq(mm.pk(mm.int(20)).noDefaultValueOnCSQL.__getData().noDefaultValueOnCSQL, true);
});

it('text', () => {
  const t = mm.text().__type();
  ok(t.types.includes(mm.dt.text));
  eq(t.length, 0);
  eq(t.unsigned, false);
});

it('double', () => {
  const t = mm.double(20).__type();
  ok(t.types.includes(mm.dt.double));
  eq(t.length, 20);
  eq(t.unsigned, false);

  const t2 = mm.double().__type();
  eq(t2.length, 0);
});

it('float', () => {
  const t = mm.float(20).__type();
  ok(t.types.includes(mm.dt.float));
  eq(t.length, 20);
  eq(t.unsigned, false);
});

it('bool', () => {
  const t = mm.bool().__type();
  ok(t.types.includes(mm.dt.bool));
  eq(t.unsigned, false);
});

it('datetime', () => {
  let c = mm.datetime();
  ok(c.__type().types.includes(mm.dt.datetime));

  c = mm.datetime({ defaultToNow: 'local' });
  eq(`${c.__getData().defaultValue}`, '`LOCALDATETIMENOW()`');

  c = mm.datetime({ defaultToNow: 'utc' });
  eq(`${c.__getData().defaultValue}`, '`UTCDATETIMENOW()`');

  c = mm.datetime({ fsp: 4 });
  eq(c.__getData().type.length, 4);
});

it('date', () => {
  let c = mm.date();
  ok(c.__type().types.includes(mm.dt.date));

  c = mm.date({ defaultToNow: 'local' });
  eq(`${c.__getData().defaultValue}`, '`LOCALDATENOW()`');

  c = mm.date({ defaultToNow: 'utc' });
  eq(`${c.__getData().defaultValue}`, '`UTCDATENOW()`');

  c = mm.date({ fsp: 4 });
  eq(c.__getData().type.length, 4);
});

it('time', () => {
  let c = mm.time();
  ok(c.__type().types.includes(mm.dt.time));

  c = mm.time({ defaultToNow: 'local' });
  eq(`${c.__getData().defaultValue}`, '`LOCALTIMENOW()`');

  c = mm.time({ defaultToNow: 'utc' });
  eq(`${c.__getData().defaultValue}`, '`UTCTIMENOW()`');

  c = mm.time({ fsp: 4 });
  eq(c.__getData().type.length, 4);
});

it('timestamp', () => {
  let c = mm.timestamp();
  ok(c.__type().types.includes(mm.dt.timestamp));

  c = mm.timestamp({ defaultToNow: 'utc' });
  eq(`${c.__getData().defaultValue}`, '`TIMESTAMPNOW()`');

  c = mm.timestamp({ fsp: 4 });
  eq(c.__getData().type.length, 4);
});

it('decimal', () => {
  const t = mm.decimal(5, 2).__type();
  ok(t.types.includes(mm.dt.decimal));
  eq(t.length, 5);
  eq(t.extraLength, 2);
  eq(t.unsigned, false);
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
  eq(c.__getData().defaultValue, undefined);
  c = mm.bool();
  eq(c.__getData().defaultValue, undefined);
});

it('Default FSP for datetime cols', () => {
  mm.setDefaultDateFSP(1);
  mm.setDefaultDatetimeFSP(2);
  mm.setDefaultTimeFSP(3);

  eq(mm.date().__getData().type.length, 1);
  eq(mm.datetime().__getData().type.length, 2);
  eq(mm.time().__getData().type.length, 3);
});
