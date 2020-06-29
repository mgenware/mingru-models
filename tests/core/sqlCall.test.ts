import * as assert from 'assert';
import * as mm from '../..';
import post from '../models/post';

const expect = assert.equal;

const { dt } = mm;
function dtc(dtString: string): mm.ColumnType {
  return new mm.ColumnType(dtString);
}

it('SQL calls', () => {
  let t: mm.SQLCall;
  t = mm.localDatetimeNow();
  expect(t.type, mm.SQLCallType.localDatetimeNow);
  assert.deepEqual(t.returnType, dtc(dt.datetime));

  t = mm.utcDatetimeNow();
  expect(t.type, mm.SQLCallType.utcDatetimeNow);
  assert.deepEqual(t.returnType, dtc(dt.datetime));

  t = mm.localDateNow();
  expect(t.type, mm.SQLCallType.localDateNow);
  assert.deepEqual(t.returnType, dtc(dt.date));

  t = mm.utcDateNow();
  expect(t.type, mm.SQLCallType.utcDateNow);
  assert.deepEqual(t.returnType, dtc(dt.date));

  t = mm.localTimeNow();
  expect(t.type, mm.SQLCallType.localTimeNow);
  assert.deepEqual(t.returnType, dtc(dt.time));

  t = mm.utcTimeNow();
  expect(t.type, mm.SQLCallType.utcTimeNow);
  assert.deepEqual(t.returnType, dtc(dt.time));

  t = mm.count(post.id);
  expect(t.type, mm.SQLCallType.count);
  assert.deepEqual(t.returnType, dtc(dt.int));

  t = mm.coalesce(mm.sql`haha`, post.title, post.user_id);
  expect(t.type, mm.SQLCallType.coalesce);
  assert.deepEqual(t.returnType, mm.varChar(100).__type);

  assert.deepEqual(mm.countAll(), mm.count('*'));

  t = mm.year(post.id);
  expect(t.type, mm.SQLCallType.year);
  assert.deepEqual(t.returnType, dtc(dt.int));

  t = mm.month(post.id);
  expect(t.type, mm.SQLCallType.month);
  assert.deepEqual(t.returnType, dtc(dt.int));

  t = mm.day(post.id);
  expect(t.type, mm.SQLCallType.day);
  assert.deepEqual(t.returnType, dtc(dt.int));

  t = mm.week(post.id);
  expect(t.type, mm.SQLCallType.week);
  assert.deepEqual(t.returnType, dtc(dt.int));

  t = mm.hour(post.id);
  expect(t.type, mm.SQLCallType.hour);
  assert.deepEqual(t.returnType, dtc(dt.int));

  t = mm.minute(post.id);
  expect(t.type, mm.SQLCallType.minute);
  assert.deepEqual(t.returnType, dtc(dt.int));

  t = mm.second(post.id);
  expect(t.type, mm.SQLCallType.second);
  assert.deepEqual(t.returnType, dtc(dt.int));

  t = mm.min(post.id);
  expect(t.type, mm.SQLCallType.min);
  assert.deepEqual(t.returnType, dtc(dt.int));

  t = mm.max(post.id);
  expect(t.type, mm.SQLCallType.max);
  assert.deepEqual(t.returnType, dtc(dt.int));

  t = mm.avg(post.id);
  expect(t.type, mm.SQLCallType.avg);
  assert.deepEqual(t.returnType, dtc(dt.int));

  t = mm.sum(post.id);
  expect(t.type, mm.SQLCallType.sum);
  assert.deepEqual(t.returnType, dtc(dt.int));

  t = mm.exists(post.id);
  expect(t.type, mm.SQLCallType.exists);
  assert.deepEqual(t.returnType, dtc(dt.bool));

  t = mm.notExists(post.id);
  expect(t.type, mm.SQLCallType.notExists);
  assert.deepEqual(t.returnType, dtc(dt.bool));

  t = mm.ifNull(post.id, post.title);
  expect(t.type, mm.SQLCallType.ifNull);
  assert.deepEqual(t.returnType, 0);
});

it('Embeded in SQL', () => {
  expect(
    mm.sql`haha ${mm.localDatetimeNow()} ${mm.localDateNow()}`.toString(),
    'SQL(E(haha , type = 0), E(SQLCall(0, return = ColType(SQL.DATETIME), type = 3), E( , type = 0), E(SQLCall(1, return = ColType(SQL.DATE), type = 3))',
  );
  expect(
    mm.sql`haha ${mm.sqlCall(
      mm.SQLCallType.localDatetimeNow,
      new mm.ColumnType('c1'),
    )} ${mm.sqlCall(
      mm.SQLCallType.localDateNow,
      new mm.ColumnType('c2'),
    )}`.toString(),
    'SQL(E(haha , type = 0), E(SQLCall(0, return = ColType(c1), type = 3), E( , type = 0), E(SQLCall(1, return = ColType(c2), type = 3))',
  );
});
