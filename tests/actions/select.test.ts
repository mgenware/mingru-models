import * as dd from '../../';
import user from '../models/user';
import post from '../models/post';
import * as assert from 'assert';

const expect = assert.equal;
const ok = assert.ok;

it('select', () => {
  class UserTA extends dd.TA {
    t = dd.select(user.id, user.name).where(dd.sql`${user.id} = 1`);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  ok(v instanceof dd.SelectAction);
  ok(v instanceof dd.CoreSelectAction);
  ok(v instanceof dd.Action);
  expect(v.columns.length, 2);
  expect(v.columns[0], user.id);
  expect(v.columns[1], user.name);
  expect(v.whereSQL!.toString(), '`id` = 1');
  expect(v.mode, dd.SelectActionMode.row);
  expect(v.actionType, dd.ActionType.select);
});

it('Select *', () => {
  class UserTA extends dd.TA {
    t = dd.select();
  }
  assert.doesNotThrow(() => dd.ta(user, UserTA));
});

it('selectRows', () => {
  class UserTA extends dd.TA {
    t = dd
      .selectRows(user.id, user.name)
      .where(dd.sql`${user.id} = 1`)
      .orderByAsc(user.id);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  expect(v.mode, dd.SelectActionMode.list);
});

it('as', () => {
  const a = user.id.as('a');
  const b = user.name.as('b');
  const c = user.id.as('c');

  ok(a instanceof dd.RawColumn);
  expect(a.selectedName, 'a');
  expect(b.selectedName, 'b');
  expect(c.selectedName, 'c');
});

it('RawColumn', () => {
  const a = user.id.as('x');
  const b = new dd.RawColumn(user.id, 'y');
  expect(a.selectedName, 'x');
  expect(a.core, user.id);
  expect(b.selectedName, 'y');
  expect(b.core, user.id);
});

it('RawColumn (raw SQL)', () => {
  const a = new dd.RawColumn(dd.sql`123`, 'x');
  const b = new dd.RawColumn(dd.sql`COUNT(${user.name})`, 'y');
  expect(a.selectedName, 'x');
  expect(a.core.toString(), '123');
  expect(b.selectedName, 'y');
  expect(b.core.toString(), 'COUNT(`name`)');
});

it('RawColumn (types)', () => {
  const a = new dd.RawColumn(dd.sql`123`, 'x', new dd.ColumnType(['t1', 't2']));
  expect(a.selectedName, 'x');
  expect(a.core.toString(), '123');
  assert.deepEqual(a.type, new dd.ColumnType(['t1', 't2']));
});

it('RawColumn (count)', () => {
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
  expect(cc.selectedName, 'count');
  expect(cc.core.toString(), 'CALL(3, `name`)');
});

it('RawColumn (SQLConvertible)', () => {
  let cc = new dd.RawColumn(post.user_id, 't');
  // Column should not be wrapped in SQL
  expect(cc.core, post.user_id);
  cc = new dd.RawColumn('str', 't');
  expect(cc.core.toString(), 'str');
  cc = new dd.RawColumn(dd.count(post.id), 't');
  expect(cc.core.toString(), 'CALL(3, `id`)');
});

it('RawColumn (infer name from columns)', () => {
  let cc = dd.sel(user.name);
  expect(cc.selectedName, 'name');
  cc = new dd.RawColumn(dd.coalesce('a', user.name, user.snake_case_name));
  expect(cc.selectedName, 'name');
});

it('dd.select (types)', () => {
  const a = dd.sel(dd.sql`123`, 'x', new dd.ColumnType(['t1', 't2']));
  expect(a.selectedName, 'x');
  expect(a.core.toString(), '123');
  assert.deepEqual(a.type, new dd.ColumnType(['t1', 't2']));
});

it('byID', () => {
  class UserTA extends dd.TA {
    t = dd.select(user.name).byID();
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  expect(v.whereSQL!.toString(), '`id` = <id: [id]>');
});

it('byID with inputName', () => {
  class UserTA extends dd.TA {
    t = dd.select(user.name).byID('haha');
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  expect(v.whereSQL!.toString(), '`id` = <haha: [id]>');
});

it('by', () => {
  class UserTA extends dd.TA {
    t = dd.select(user.name).by(user.snake_case_name);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  expect(v.whereSQL!.toString(), '<snakeCaseName: [snake_case_name]>');
});

it('andBy', () => {
  class UserTA extends dd.TA {
    t1 = dd
      .select(user.name)
      .by(user.snake_case_name)
      .andBy(user.follower_count);
    t2 = dd.select(user.name).andBy(user.follower_count);
    t3 = dd
      .select(user.name)
      .byID()
      .andBy(user.follower_count);
  }
  const ta = dd.ta(user, UserTA);
  expect(
    ta.t1.whereSQL!.toString(),
    '<snakeCaseName: [snake_case_name]> AND <followerCount: [follower_count]>',
  );
  expect(ta.t2.whereSQL!.toString(), '<followerCount: [follower_count]>');
  expect(
    ta.t3.whereSQL!.toString(),
    '`id` = <id: [id]> AND <followerCount: [follower_count]>',
  );
});

it('selectField', () => {
  const sc = dd.sel(dd.count('*'), 'c');
  class UserTA extends dd.TA {
    t = dd.selectField(user.name).byID();
    t2 = dd.selectField(sc);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  expect(v.mode, dd.SelectActionMode.field);
  expect(v.columns[0], user.name);

  const v2 = ta.t2;
  assert.deepEqual(v2.columns[0], sc);
});

it('Order by', () => {
  const cc = dd.sel('haha', 'name', new dd.ColumnType('int'));
  class UserTA extends dd.TA {
    t = dd
      .select(user.name, user.follower_count, cc)
      .byID()
      .orderByAsc(user.name)
      .orderByAsc(cc)
      .orderByDesc(user.follower_count);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;

  expect(v.orderByColumns.length, 3);
  expect(v.orderByColumns[0].column, user.name);
  expect(v.orderByColumns[0].desc, false);
  expect(v.orderByColumns[1].column, cc);
  expect(v.orderByColumns[1].desc, false);
  expect(v.orderByColumns[2].column, user.follower_count);
  expect(v.orderByColumns[2].desc, true);
});

it('Validate columns', () => {
  const t = user;
  assert.throws(() => {
    class UserTA extends dd.TA {
      t = dd.selectRows(
        t.name,
        (null as unknown) as dd.Column,
        t.follower_count,
      );
    }
    dd.ta(user, UserTA);
  }, 'null');
  assert.throws(() => {
    class UserTA extends dd.TA {
      t = dd.selectRows(t.name, (32 as unknown) as dd.Column, t.follower_count);
    }
    dd.ta(user, UserTA);
  }, 'not a valid');
});

it('having', () => {
  class UserTA extends dd.TA {
    t = dd
      .selectRows(user.id, user.name)
      .groupBy(user.name)
      .having(dd.sql`${dd.count(user.name)} > 2`)
      .orderByAsc(user.id);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  expect(v.groupByColumns[0].column, user.name);
  expect(v.havingSQL!.toString(), 'CALL(3, `name`) > 2');
});

it('Throw when limit is called on non-list mode', () => {
  const t = user;
  assert.throws(() => {
    class UserTA extends dd.TA {
      t = dd.selectField(t.name).limit();
    }
    dd.ta(user, UserTA);
  }, 'list');
});

it('Throw on selecting collection without ORDER BY', () => {
  const t = user;
  assert.doesNotThrow(() => {
    class UserTA extends dd.TA {
      t = dd.selectField(t.name);
    }
    dd.ta(user, UserTA);
  });
  assert.doesNotThrow(() => {
    class UserTA extends dd.TA {
      t = dd.select(t.name);
    }
    dd.ta(user, UserTA);
  });
  assert.doesNotThrow(() => {
    class UserTA extends dd.TA {
      t = dd.selectRows(t.name).orderByAsc(t.name);
    }
    dd.ta(user, UserTA);
  });
  assert.doesNotThrow(() => {
    class UserTA extends dd.TA {
      t = dd.selectPage(t.name).orderByAsc(t.name);
    }
    dd.ta(user, UserTA);
  });
  assert.throws(() => {
    class UserTA extends dd.TA {
      t = dd.selectRows(t.name);
    }
    dd.ta(user, UserTA);
  }, 'ORDER BY');
  assert.throws(() => {
    class UserTA extends dd.TA {
      t = dd.selectPage(t.name);
    }
    dd.ta(user, UserTA);
  }, 'ORDER BY');
});
