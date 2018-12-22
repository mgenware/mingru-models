import * as dd from '../../';

test('SQL calls', () => {
  expect(dd.datetimeNow().type).toBe(dd.SQLCallType.datetimeNow);
  expect(dd.dateNow().type).toBe(dd.SQLCallType.dateNow);
  expect(dd.timeNow().type).toBe(dd.SQLCallType.timeNow);
});
