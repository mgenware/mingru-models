import * as dd from '../../';
import user from '../models/user';
import post from '../models/post';
import { RawColumn } from '../../dist/main';

test('select', () => {
  class UserTA extends dd.TA {
    t = dd.select(user.id, user.name).where(dd.sql`${user.id} = 1`);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  expect(v).toBeInstanceOf(dd.SelectAction);
  expect(v).toBeInstanceOf(dd.CoreSelectAction);
  expect(v).toBeInstanceOf(dd.Action);
  expect(v.columns.length).toBe(2);
  expect(v.columns[0]).toBe(user.id);
  expect(v.columns[1]).toBe(user.name);
  expect(v.whereSQL!.toString()).toBe('`id` = 1');
  expect(v.mode).toBe(dd.SelectActionMode.row);
  expect(v.actionType).toBe(dd.ActionType.select);
});

test('Select *', () => {
  class UserTA extends dd.TA {
    t = dd.select();
  }
  expect(() => dd.ta(user, UserTA)).not.toThrow();
});

test('selectRows', () => {
  class UserTA extends dd.TA {
    t = dd.selectRows(user.id, user.name).where(dd.sql`${user.id} = 1`);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  expect(v.mode).toBe(dd.SelectActionMode.list);
});

test('as', () => {
  const a = user.id.as('a');
  const b = user.name.as('b');
  const c = user.id.as('c');

  expect(a).toBeInstanceOf(dd.RawColumn);
  expect(a.selectedName).toBe('a');
  expect(b.selectedName).toBe('b');
  expect(c.selectedName).toBe('c');
});

test('RawColumn', () => {
  const a = user.id.as('x');
  const b = new dd.RawColumn(user.id, 'y');
  expect(a.selectedName).toBe('x');
  expect(a.core).toBe(user.id);
  expect(b.selectedName).toBe('y');
  expect(b.core).toBe(user.id);
});

test('RawColumn (raw SQL)', () => {
  const a = new dd.RawColumn(dd.sql`123`, 'x');
  const b = new dd.RawColumn(dd.sql`COUNT(${user.name})`, 'y');
  expect(a.selectedName).toBe('x');
  expect(a.core.toString()).toBe('123');
  expect(b.selectedName).toBe('y');
  expect(b.core.toString()).toBe('COUNT(`name`)');
});

test('RawColumn (types)', () => {
  const a = new dd.RawColumn(dd.sql`123`, 'x', new dd.ColumnType(['t1', 't2']));
  expect(a.selectedName).toBe('x');
  expect(a.core.toString()).toBe('123');
  expect(a.type).toEqual(new dd.ColumnType(['t1', 't2']));
});

test('RawColumn (count)', () => {
  class UserTA extends dd.TA {
    t = dd.select(
      dd.sel(
        dd.sql`${dd.count(dd.sql`${post.user_id.join(user).name}`)}`,
        'count',
      ),
    );
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  const cc = v.columns[0] as dd.RawColumn;
  expect(cc.selectedName).toBe('count');
  expect(cc.core.toString()).toBe('CALL(3, `name`)');
});

test('RawColumn (SQLConvertible)', () => {
  let cc = new RawColumn(post.user_id, 't');
  // Column should not be wrapped in SQL
  expect(cc.core).toBe(post.user_id);
  cc = new RawColumn('str', 't');
  expect(cc.core.toString()).toBe('str');
  cc = new RawColumn(dd.count(post.id), 't');
  expect(cc.core.toString()).toBe('CALL(3, `id`)');
});

test('RawColumn (infer name from columns)', () => {
  let cc = dd.sel(user.name);
  expect(cc.selectedName).toBe('name');
  cc = new RawColumn(dd.coalesce('a', user.name, user.snake_case_name));
  expect(cc.selectedName).toBe('name');
});

test('dd.select (types)', () => {
  const a = dd.sel(dd.sql`123`, 'x', new dd.ColumnType(['t1', 't2']));
  expect(a.selectedName).toBe('x');
  expect(a.core.toString()).toBe('123');
  expect(a.type).toEqual(new dd.ColumnType(['t1', 't2']));
});

test('ByID', () => {
  class UserTA extends dd.TA {
    t = dd.select(user.name).byID();
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  expect(v.whereSQL!.toString()).toBe('`id` = <id: [id]>');
});

test('selectField', () => {
  const sc = dd.sel(dd.count('*'), 'c');
  class UserTA extends dd.TA {
    t = dd.selectField(user.name).byID();
    t2 = dd.selectField(sc);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  expect(v.mode).toBe(dd.SelectActionMode.field);
  expect(v.columns[0]).toBe(user.name);

  const v2 = ta.t2;
  expect(v2.columns[0]).toEqual(sc);
});

test('Order by', () => {
  const cc = dd.sel('haha', 'name', new dd.ColumnType('int'));
  class UserTA extends dd.TA {
    t = dd
      .select(user.name, user.follower_count, cc)
      .byID()
      .orderBy(user.name)
      .orderBy(cc)
      .orderByDesc(user.follower_count);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  expect(v.orderByColumns.length).toBe(3);
  expect(v.orderByColumns[0].column).toBe(user.name);
  expect(v.orderByColumns[0].desc).toBe(false);
  expect(v.orderByColumns[1].column).toBe(cc);
  expect(v.orderByColumns[1].desc).toBe(false);
  expect(v.orderByColumns[2].column).toBe(user.follower_count);
  expect(v.orderByColumns[2].desc).toBe(true);
});

test('Validate columns', () => {
  const t = user;
  expect(() => {
    class UserTA extends dd.TA {
      t = dd.selectRows(
        t.name,
        (null as unknown) as dd.Column,
        t.follower_count,
      );
    }
    dd.ta(user, UserTA);
  }).toThrow('null');
  expect(() => {
    class UserTA extends dd.TA {
      t = dd.selectRows(t.name, (32 as unknown) as dd.Column, t.follower_count);
    }
    dd.ta(user, UserTA);
  }).toThrow('not a valid');
});

test('having', () => {
  class UserTA extends dd.TA {
    t = dd
      .selectRows(user.id, user.name)
      .groupBy(user.name)
      .having(dd.sql`${dd.count(user.name)} > 2`);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  expect(v.groupByColumns[0].column).toBe(user.name);
  expect(v.havingSQL!.toString()).toBe('CALL(3, `name`) > 2');
});

test('Throw when paginate is called on non-list mode', () => {
  const t = user;
  expect(() => {
    class UserTA extends dd.TA {
      t = dd.selectField(t.name).paginate();
    }
    dd.ta(user, UserTA);
  }).toThrow('list');
});
