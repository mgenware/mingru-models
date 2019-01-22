import * as dd from '../../';
import post from '../models/post';
import user from '../models/user';

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

test('Embed (raw)', () => {
  expect(
    dd.sql`haha ${new dd.SQLCall(dd.SQLCallType.datetimeNow)} ${new dd.SQLCall(
      dd.SQLCallType.dateNow,
    )}`.toString(),
  ).toBe(
    `haha CALL(${dd.SQLCallType.datetimeNow}) CALL(${dd.SQLCallType.dateNow})`,
  );
});

test('Count', () => {
  const actions = dd.actions(post);
  const v = actions.select(
    't',
    dd.select(
      dd.sql`${dd.count(dd.sql`${post.user_id.join(user).name}`)}`,
      'count',
    ),
  );
  const cc = v.columns[0] as dd.CalculatedColumn;
  expect(cc.selectedName).toBe('count');
  expect(cc.core.toString()).toBe('CALL(3, `name`)');
});
