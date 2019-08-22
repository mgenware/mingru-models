import * as dd from '../../';
import post from '../models/post';
import * as assert from 'assert';

const expect = assert.equal;

const { dt } = dd;
function dtc(dtString: string): dd.ColumnType {
  return new dd.ColumnType(dtString);
}

it('SQL calls', () => {
  let t: dd.SQLCall;
  t = dd.datetimeNow();
  expect(t.type, dd.SQLCallType.datetimeNow);
  assert.deepEqual(t.returnType, dtc(dt.datetime));

  t = dd.dateNow();
  expect(t.type, dd.SQLCallType.dateNow);
  assert.deepEqual(t.returnType, dtc(dt.date));

  t = dd.timeNow();
  expect(t.type, dd.SQLCallType.timeNow);
  assert.deepEqual(t.returnType, dtc(dt.time));

  t = dd.count(post.id);
  expect(t.type, dd.SQLCallType.count);
  assert.deepEqual(t.returnType, dtc(dt.int));

  t = dd.coalesce(dd.sql`haha`, post.title, post.user_id);
  expect(t.type, dd.SQLCallType.coalesce);
  assert.deepEqual(t.returnType, dd.varChar(100).type);
  assert.deepEqual(dd.countAll(), dd.count('*'));
});

it('Embed', () => {
  expect(
    dd.sql`haha ${dd.datetimeNow()} ${dd.dateNow()}`.toString(),
    `haha CALL(${dd.SQLCallType.datetimeNow}) CALL(${dd.SQLCallType.dateNow})`,
  );
});

it('Embed (raw)', () => {
  expect(
    dd.sql`haha ${new dd.SQLCall(
      dd.SQLCallType.datetimeNow,
      new dd.ColumnType('c1'),
    )} ${new dd.SQLCall(
      dd.SQLCallType.dateNow,
      new dd.ColumnType('c2'),
    )}`.toString(),
    `haha CALL(${dd.SQLCallType.datetimeNow}) CALL(${dd.SQLCallType.dateNow})`,
  );
});
