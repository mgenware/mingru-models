import * as dd from '../../';
import user from '../models/user';
import post from '../models/post';
import * as assert from 'assert';

const expect = assert.equal;
const ok = assert.ok;

it('select', () => {
  class UserTA extends dd.TableActions {
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
  expect(
    v.whereSQLString,
    'SQL(E(Column(id, Table(user)), type = 1), E( = 1, type = 0))',
  );
  expect(v.mode, dd.SelectActionMode.row);
  expect(v.actionType, dd.ActionType.select);
});

it('Select *', () => {
  class UserTA extends dd.TableActions {
    t = dd.select();
  }
  assert.doesNotThrow(() => dd.ta(user, UserTA));
});

it('selectRows', () => {
  class UserTA extends dd.TableActions {
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
  // as
  let c = user.id.as('x');
  expect(c.selectedName, 'x');
  expect(c.core, user.id);

  // new RawColumn
  c = new dd.RawColumn(user.id, 'y');
  expect(c.selectedName, 'y');
  expect(c.core, user.id);

  // dd.sel
  c = dd.sel(user.id, 'x');
  expect(c.selectedName, 'x');
  expect(c.core, user.id);

  // new RawColumn
  c = new dd.RawColumn(user.id);
  expect(c.selectedName, 'id');
  expect(c.core, user.id);

  // dd.sel
  c = dd.sel(user.id);
  expect(c.selectedName, 'id');
  expect(c.core, user.id);
});

it('RawColumn (raw SQL)', () => {
  const a = new dd.RawColumn(dd.sql`123`, 'x');
  const b = new dd.RawColumn(dd.sql`COUNT(${user.name})`, 'y');
  expect(a.selectedName, 'x');
  expect(a.core.toString(), 'SQL(E(123, type = 0))');
  expect(b.selectedName, 'y');
  expect(
    b.core.toString(),
    'SQL(E(COUNT(, type = 0), E(Column(name, Table(user)), type = 1), E(), type = 0))',
  );
});

it('RawColumn (types)', () => {
  const a = new dd.RawColumn(dd.sql`123`, 'x', new dd.ColumnType(['t1', 't2']));
  expect(a.selectedName, 'x');
  expect(a.core.toString(), 'SQL(E(123, type = 0))');
  assert.deepEqual(a.type, new dd.ColumnType(['t1', 't2']));
});

it('RawColumn (count)', () => {
  class UserTA extends dd.TableActions {
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
  expect(
    cc.core.toString(),
    'SQL(E(SQLCall(3, return = ColType(SQL.INT), params = SQL(E(Column(name, [object Object]), type = 1))), type = 3))',
  );
});

it('RawColumn (SQLConvertible)', () => {
  let cc = new dd.RawColumn(post.user_id, 't');
  // Column should not be wrapped in SQL
  expect(cc.core, post.user_id);
  cc = new dd.RawColumn('str', 't');
  expect(cc.core.toString(), 'SQL(E(str, type = 0))');
  cc = new dd.RawColumn(dd.count(post.id), 't');
  expect(
    cc.core.toString(),
    'SQL(E(SQLCall(3, return = ColType(SQL.INT), params = SQL(E(Column(id, Table(post)), type = 1))), type = 3))',
  );
});

it('RawColumn (infer name from columns)', () => {
  let cc = dd.sel(user.name);
  expect(cc.selectedName, 'name');
  cc = new dd.RawColumn(dd.coalesce('a', user.name, user.snake_case_name));
  expect(cc.selectedName, 'name');
});

it('RawColumn.toInput', () => {
  // .core is column
  let cc = dd.sel(user.name);
  expect(
    cc.toInput().toString(),
    'SQLVar(name, desc = Column(name, Table(user)))',
  );
  // .core is SQL
  cc = dd.sel(dd.sql`haha${user.id}`);
  expect(cc.toInput().toString(), 'SQLVar(id, desc = ColType(SQL.BIGINT))');

  cc = dd.sel(dd.sql`${dd.max(dd.sql``)}`, 'haha');
  expect(cc.toInput().toString(), 'SQLVar(haha, desc = ColType(SQL.INT))');
});

it('dd.select (types)', () => {
  const a = dd.sel(dd.sql`123`, 'x', new dd.ColumnType(['t1', 't2']));
  expect(a.selectedName, 'x');
  expect(a.core.toString(), 'SQL(E(123, type = 0))');
  assert.deepEqual(a.type, new dd.ColumnType(['t1', 't2']));
});

it('byID', () => {
  class UserTA extends dd.TableActions {
    t = dd.select(user.name).byID();
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  expect(
    v.whereSQLString,
    'SQL(E(Column(id, Table(user)), type = 1), E( = , type = 0), E(SQLVar(id, desc = Column(id, Table(user))), type = 2))',
  );
});

it('byID with inputName', () => {
  class UserTA extends dd.TableActions {
    t = dd.select(user.name).byID('haha');
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  expect(
    v.whereSQLString,
    'SQL(E(Column(id, Table(user)), type = 1), E( = , type = 0), E(SQLVar(haha, desc = Column(id, Table(user))), type = 2))',
  );
});

it('by', () => {
  class UserTA extends dd.TableActions {
    t = dd.select(user.name).by(user.snake_case_name);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  expect(
    v.whereSQLString,
    'SQL(E(SQLVar(snakeCaseName, desc = Column(snake_case_name, Table(user))), type = 2))',
  );
});

it('andBy', () => {
  class UserTA extends dd.TableActions {
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
    ta.t1.whereSQLString,
    'SQL(E(SQLVar(snakeCaseName, desc = Column(snake_case_name, Table(user))), type = 2), E( AND , type = 0), E(SQLVar(followerCount, desc = Column(follower_count, Table(user))), type = 2))',
  );
  expect(
    ta.t2.whereSQLString,
    'SQL(E(SQLVar(followerCount, desc = Column(follower_count, Table(user))), type = 2))',
  );
  expect(
    ta.t3.whereSQLString,
    'SQL(E(Column(id, Table(user)), type = 1), E( = , type = 0), E(SQLVar(id, desc = Column(id, Table(user))), type = 2), E( AND , type = 0), E(SQLVar(followerCount, desc = Column(follower_count, Table(user))), type = 2))',
  );
});

it('selectField', () => {
  const sc = dd.sel(dd.count('*'), 'c');
  class UserTA extends dd.TableActions {
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
  class UserTA extends dd.TableActions {
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
    class UserTA extends dd.TableActions {
      t = dd.selectRows(
        t.name,
        (null as unknown) as dd.Column,
        t.follower_count,
      );
    }
    dd.ta(user, UserTA);
  }, 'null');
  assert.throws(() => {
    class UserTA extends dd.TableActions {
      t = dd.selectRows(t.name, (32 as unknown) as dd.Column, t.follower_count);
    }
    dd.ta(user, UserTA);
  }, 'not a valid');
});

it('GROUP BY names', () => {
  const col = dd.sel(user.id, 'raw');
  class UserTA extends dd.TableActions {
    t = dd
      .selectRows(user.id, col)
      .groupBy(user.name, col, 'haha')
      .having(dd.sql`${dd.count(user.name)} > 2`)
      .orderByAsc(user.id);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  expect(v.groupByColumns[0], user.name.getDBName());
  expect(
    v.havingSQL,
    'SQL(E(SQLCall(3, return = ColType(SQL.INT), params = SQL(E(Column(name, Table(user)), type = 1))), type = 3), E( > 2, type = 0))',
  );
});

it('HAVING', () => {
  class UserTA extends dd.TableActions {
    t = dd
      .selectRows(user.id, user.name)
      .groupBy(user.name)
      .having(dd.sql`${dd.count(user.name)} > 2`)
      .orderByAsc(user.id);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  expect(v.groupByColumns[0], user.name.getDBName());
  expect(
    v.havingSQL,
    'SQL(E(SQLCall(3, return = ColType(SQL.INT), params = SQL(E(Column(name, Table(user)), type = 1))), type = 3), E( > 2, type = 0))',
  );
});

it('Throw when limit is called on non-list mode', () => {
  const t = user;
  assert.throws(() => {
    class UserTA extends dd.TableActions {
      t = dd.selectField(t.name).limit();
    }
    dd.ta(user, UserTA);
  }, 'list');
});

it('Throw on selecting collection without ORDER BY', () => {
  const t = user;
  assert.doesNotThrow(() => {
    class UserTA extends dd.TableActions {
      t = dd.selectField(t.name);
    }
    dd.ta(user, UserTA);
  });
  assert.doesNotThrow(() => {
    class UserTA extends dd.TableActions {
      t = dd.select(t.name);
    }
    dd.ta(user, UserTA);
  });
  assert.doesNotThrow(() => {
    class UserTA extends dd.TableActions {
      t = dd.selectRows(t.name).orderByAsc(t.name);
    }
    dd.ta(user, UserTA);
  });
  assert.doesNotThrow(() => {
    class UserTA extends dd.TableActions {
      t = dd.selectPage(t.name).orderByAsc(t.name);
    }
    dd.ta(user, UserTA);
  });
  assert.throws(() => {
    class UserTA extends dd.TableActions {
      t = dd.selectRows(t.name);
    }
    dd.ta(user, UserTA);
  }, 'ORDER BY');
  assert.throws(() => {
    class UserTA extends dd.TableActions {
      t = dd.selectPage(t.name);
    }
    dd.ta(user, UserTA);
  }, 'ORDER BY');
});

it('RawColumn.toInput', () => {
  let c = dd.sel(user.name);
  let v = c.toInput();
  expect(v.toString(), 'SQLVar(name, desc = Column(name, Table(user)))');

  c = dd.sel(user.name, 'haha', dd.int().type);
  v = c.toInput();
  expect(v.toString(), 'SQLVar(haha, desc = Column(name, Table(user)))');
});

it('Set action.__table via from()', () => {
  class UserTA extends dd.TableActions {
    t = dd.select(user.id, user.name);
    t2 = dd.select(post.id).from(post);
  }
  const ta = dd.ta(user, UserTA);
  expect(ta.t.__table, user);
  expect(ta.t2.__table, post);
});
