import * as dd from '../../';

test('SQL calls', () => {
  expect(dd.datetimeNow().type).toBe(dd.SQLCallType.datetimeNow);
  expect(dd.dateNow().type).toBe(dd.SQLCallType.dateNow);
  expect(dd.timeNow().type).toBe(dd.SQLCallType.timeNow);
});

test('Embed', () => {
  expect(dd.sql`haha ${dd.datetimeNow()} ${dd.dateNow()}`.toString()).toBe(
    `haha CALL(${dd.SQLCallType.datetimeNow}) CALL(${dd.SQLCallType.dateNow})`,
  );
});
