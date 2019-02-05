import * as dd from '../../';
import post from '../models/post';

const { dt } = dd;
function dtc(dtString: string): dd.ColumnType {
  return new dd.ColumnType(dtString);
}

test('SQL calls', () => {
  let t: dd.SQLCall;
  t = dd.datetimeNow();
  expect(t.type).toBe(dd.SQLCallType.datetimeNow);
  expect(t.returnType).toEqual(dtc(dt.datetime));

  t = dd.dateNow();
  expect(t.type).toBe(dd.SQLCallType.dateNow);
  expect(t.returnType).toEqual(dtc(dt.date));

  t = dd.timeNow();
  expect(t.type).toBe(dd.SQLCallType.timeNow);
  expect(t.returnType).toEqual(dtc(dt.time));

  t = dd.count(post.id);
  expect(t.type).toBe(dd.SQLCallType.count);
  expect(t.returnType).toEqual(dtc(dt.int));

  t = dd.coalesce(dd.sql`haha`, post.title, post.user_id);
  expect(t.type).toBe(dd.SQLCallType.coalesce);
  expect(t.returnType).toEqual(dd.varChar(100).type);
});

test('Embed', () => {
  expect(dd.sql`haha ${dd.datetimeNow()} ${dd.dateNow()}`.toString()).toBe(
    `haha CALL(${dd.SQLCallType.datetimeNow}) CALL(${dd.SQLCallType.dateNow})`,
  );
});

test('Embed (raw)', () => {
  expect(
    dd.sql`haha ${new dd.SQLCall(
      dd.SQLCallType.datetimeNow,
      new dd.ColumnType('c1'),
    )} ${new dd.SQLCall(
      dd.SQLCallType.dateNow,
      new dd.ColumnType('c2'),
    )}`.toString(),
  ).toBe(
    `haha CALL(${dd.SQLCallType.datetimeNow}) CALL(${dd.SQLCallType.dateNow})`,
  );
});
