import * as mm from '../../';
import post from '../models/post';
import * as assert from 'assert';

const expect = assert.equal;

const { dt } = mm;
function dtc(dtString: string): mm.ColumnType {
  return new mm.ColumnType(dtString);
}

it('SQL calls', () => {
  let t: mm.SQLCall;
  t = mm.datetimeNow();
  expect(t.type, mm.SQLCallType.datetimeNow);
  assert.deepEqual(t.returnType, dtc(dt.datetime));

  t = mm.dateNow();
  expect(t.type, mm.SQLCallType.dateNow);
  assert.deepEqual(t.returnType, dtc(dt.date));

  t = mm.timeNow();
  expect(t.type, mm.SQLCallType.timeNow);
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
});

it('Embeded in SQL', () => {
  expect(
    mm.sql`haha ${mm.datetimeNow()} ${mm.dateNow()}`.toString(),
    `SQL(E(haha , type = 0), E(SQLCall(0, return = ColType(SQL.DATETIME), type = 3), E( , type = 0), E(SQLCall(1, return = ColType(SQL.DATE), type = 3))`,
  );
  expect(
    mm.sql`haha ${new mm.SQLCall(
      mm.SQLCallType.datetimeNow,
      new mm.ColumnType('c1'),
    )} ${new mm.SQLCall(
      mm.SQLCallType.dateNow,
      new mm.ColumnType('c2'),
    )}`.toString(),
    `SQL(E(haha , type = 0), E(SQLCall(0, return = ColType(c1), type = 3), E( , type = 0), E(SQLCall(1, return = ColType(c2), type = 3))`,
  );
});
