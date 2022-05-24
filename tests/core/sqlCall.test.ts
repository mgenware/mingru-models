import * as mm from '../../dist/main.js';
import post from '../models/post.js';
import { eq, deepEq } from '../assert-aliases.js';

const { dt } = mm;
function dtc(dtString: string): mm.ColumnType {
  return new mm.ColumnType(dtString);
}

it('SQL calls', () => {
  let t: mm.SQLCall;
  t = mm.datetimeNow();
  eq(t.type, mm.SQLCallType.datetimeNow);
  deepEq(t.returnType, dtc(dt.datetime));

  t = mm.utcDatetimeNow();
  eq(t.type, mm.SQLCallType.utcDatetimeNow);
  deepEq(t.returnType, dtc(dt.datetime));

  t = mm.dateNow();
  eq(t.type, mm.SQLCallType.dateNow);
  deepEq(t.returnType, dtc(dt.date));

  t = mm.utcDateNow();
  eq(t.type, mm.SQLCallType.utcDateNow);
  deepEq(t.returnType, dtc(dt.date));

  t = mm.timeNow();
  eq(t.type, mm.SQLCallType.timeNow);
  deepEq(t.returnType, dtc(dt.time));

  t = mm.utcTimeNow();
  eq(t.type, mm.SQLCallType.utcTimeNow);
  deepEq(t.returnType, dtc(dt.time));

  t = mm.count(post.id);
  eq(t.type, mm.SQLCallType.count);
  deepEq(t.returnType, dtc(dt.int));

  t = mm.coalesce(mm.sql`haha`, post.title, post.user_id);
  eq(t.type, mm.SQLCallType.coalesce);
  deepEq(t.returnType, mm.varChar(100).__type());

  deepEq(mm.countAll(), mm.count('*'));

  t = mm.year(post.id);
  eq(t.type, mm.SQLCallType.year);
  deepEq(t.returnType, dtc(dt.int));

  t = mm.month(post.id);
  eq(t.type, mm.SQLCallType.month);
  deepEq(t.returnType, dtc(dt.int));

  t = mm.day(post.id);
  eq(t.type, mm.SQLCallType.day);
  deepEq(t.returnType, dtc(dt.int));

  t = mm.week(post.id);
  eq(t.type, mm.SQLCallType.week);
  deepEq(t.returnType, dtc(dt.int));

  t = mm.hour(post.id);
  eq(t.type, mm.SQLCallType.hour);
  deepEq(t.returnType, dtc(dt.int));

  t = mm.minute(post.id);
  eq(t.type, mm.SQLCallType.minute);
  deepEq(t.returnType, dtc(dt.int));

  t = mm.second(post.id);
  eq(t.type, mm.SQLCallType.second);
  deepEq(t.returnType, dtc(dt.int));

  t = mm.min(post.id);
  eq(t.type, mm.SQLCallType.min);
  deepEq(t.returnType, dtc(dt.int));

  t = mm.max(post.id);
  eq(t.type, mm.SQLCallType.max);
  deepEq(t.returnType, dtc(dt.int));

  t = mm.avg(post.id);
  eq(t.type, mm.SQLCallType.avg);
  deepEq(t.returnType, dtc(dt.int));

  t = mm.sum(post.id);
  eq(t.type, mm.SQLCallType.sum);
  deepEq(t.returnType, dtc(dt.int));

  t = mm.exists(post.id);
  eq(t.type, mm.SQLCallType.exists);
  deepEq(t.returnType, dtc(dt.bool));

  t = mm.notExists(post.id);
  eq(t.type, mm.SQLCallType.notExists);
  deepEq(t.returnType, dtc(dt.bool));

  t = mm.ifNull(post.id, post.title);
  eq(t.type, mm.SQLCallType.ifNull);
  deepEq(t.returnType, 0);

  t = mm.IF(post.id, post.title, post.snake_case_user_id);
  eq(t.type, mm.SQLCallType.IF);
  deepEq(t.returnType, 1);
});

it('Embeded in SQL', () => {
  eq(mm.sql`haha ${mm.datetimeNow()} ${mm.dateNow()}`.toString(), '`haha DATETIMENOW() DATENOW()`');
  eq(
    mm.sql`haha ${mm.sqlCall(mm.SQLCallType.datetimeNow, new mm.ColumnType('c1'))} ${mm.sqlCall(
      mm.SQLCallType.dateNow,
      new mm.ColumnType('c2'),
    )}`.toString(),
    '`haha DATETIMENOW() DATENOW()`',
  );
});

it('setReturnType', () => {
  const type = mm.int().__type();
  const call = mm.IF(mm.exists(mm.selectRow(post.title).by(post.id)), '1', '2').setReturnType(type);
  eq(call.returnType, type);
});

it('SQLCall.toColumn', () => {
  const c1 = new mm.SelectedColumn(mm.sql`${mm.utcDateNow()}`, 'd');
  eq(c1.toString(), 'SelectedColumn(d, core=`UTCDATENOW()`)');

  const c2 = mm.utcDateNow().toColumn('d');
  eq(c2.toString(), 'SelectedColumn(d, core=`UTCDATENOW()`)');
});
