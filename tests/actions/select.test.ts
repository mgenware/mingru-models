import * as mm from '../../';
import user from '../models/user';
import post from '../models/post';
import * as assert from 'assert';
import { itThrows } from 'it-throws';

const expect = assert.equal;
const ok = assert.ok;

it('select', () => {
  class UserTA extends mm.TableActions {
    t = mm.select(user.id, user.name).where(mm.sql`${user.id} = 1`);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;

  ok(v instanceof mm.SelectAction);
  ok(v instanceof mm.CoreSelectAction);
  ok(v instanceof mm.Action);
  expect(v.columns.length, 2);
  expect(v.columns[0], user.id);
  expect(v.columns[1], user.name);
  expect(
    v.whereSQLString,
    'SQL(E(Column(id, Table(user)), type = 1), E( = 1, type = 0))',
  );
  expect(v.mode, mm.SelectActionMode.row);
  expect(v.actionType, mm.ActionType.select);
});

it('Select *', () => {
  class UserTA extends mm.TableActions {
    t = mm.select();
  }
  assert.doesNotThrow(() => mm.tableActions(user, UserTA));
});

it('selectRows', () => {
  class UserTA extends mm.TableActions {
    t = mm
      .selectRows(user.id, user.name)
      .where(mm.sql`${user.id} = 1`)
      .orderByAsc(user.id);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  expect(v.mode, mm.SelectActionMode.list);
});

it('as', () => {
  const a = user.id.as('a');
  const b = user.name.as('b');
  const c = user.id.as('c');

  ok(a instanceof mm.RawColumn);
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
  c = new mm.RawColumn(user.id, 'y');
  expect(c.selectedName, 'y');
  expect(c.core, user.id);

  // mm.sel
  c = mm.sel(user.id, 'x');
  expect(c.selectedName, 'x');
  expect(c.core, user.id);

  // new RawColumn
  c = new mm.RawColumn(user.id);
  expect(c.selectedName, undefined);
  expect(c.core, user.id);

  // mm.sel
  c = mm.sel(user.id);
  expect(c.selectedName, undefined);
  expect(c.core, user.id);
});

it('RawColumn (raw SQL)', () => {
  const a = new mm.RawColumn(mm.sql`123`, 'x');
  const b = new mm.RawColumn(mm.sql`COUNT(${user.name})`, 'y');
  expect(a.selectedName, 'x');
  expect(a.core.toString(), 'SQL(E(123, type = 0))');
  expect(b.selectedName, 'y');
  expect(
    b.core.toString(),
    'SQL(E(COUNT(, type = 0), E(Column(name, Table(user)), type = 1), E(), type = 0))',
  );
});

it('RawColumn (types)', () => {
  const a = new mm.RawColumn(mm.sql`123`, 'x', new mm.ColumnType(['t1', 't2']));
  expect(a.selectedName, 'x');
  expect(a.core.toString(), 'SQL(E(123, type = 0))');
  assert.deepEqual(a.type, new mm.ColumnType(['t1', 't2']));
});

it('RawColumn (count)', () => {
  class UserTA extends mm.TableActions {
    t = mm.select(
      mm.sel(
        mm.sql`${mm.count(mm.sql`${post.user_id.join(user).name}`)}`,
        'count',
      ),
    );
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;

  const cc = v.columns[0] as mm.RawColumn;
  expect(cc.selectedName, 'count');
  expect(
    cc.core.toString(),
    'SQL(E(SQLCall(3, return = ColType(SQL.INT), params = SQL(E(Column(name, JoinedTable([[post.user_id].[user.id]])), type = 1))), type = 3))',
  );
});

it('RawColumn (SQLConvertible)', () => {
  let cc = new mm.RawColumn(post.user_id, 't');
  // Column should not be wrapped in SQL
  expect(cc.core, post.user_id);
  cc = new mm.RawColumn('str', 't');
  expect(cc.core.toString(), 'SQL(E(str, type = 0))');
  cc = new mm.RawColumn(mm.count(post.id), 't');
  expect(
    cc.core.toString(),
    'SQL(E(SQLCall(3, return = ColType(SQL.INT), params = SQL(E(Column(id, Table(post)), type = 1))), type = 3))',
  );
});

it('RawColumn.toInput', () => {
  // .core is column
  let cc = mm.sel(user.name);
  expect(
    cc.toInput().toString(),
    'SQLVar(name, desc = Column(name, Table(user)))',
  );
  // .core is SQL
  cc = mm.sel(mm.sql`haha${user.id}`);
  expect(cc.toInput().toString(), 'SQLVar(id, desc = ColType(SQL.BIGINT))');

  cc = mm.sel(mm.sql`${mm.max(mm.sql``)}`, 'haha');
  expect(cc.toInput().toString(), 'SQLVar(haha, desc = ColType(SQL.INT))');

  let c = mm.sel(user.name);
  let v = c.toInput();
  expect(v.toString(), 'SQLVar(name, desc = Column(name, Table(user)))');

  c = mm.sel(user.name, 'haha', mm.int().__type);
  v = c.toInput();
  expect(v.toString(), 'SQLVar(haha, desc = Column(name, Table(user)))');
});

it('mm.select (types)', () => {
  const a = mm.sel(mm.sql`123`, 'x', new mm.ColumnType(['t1', 't2']));
  expect(a.selectedName, 'x');
  expect(a.core.toString(), 'SQL(E(123, type = 0))');
  assert.deepEqual(a.type, new mm.ColumnType(['t1', 't2']));
});

it('byID', () => {
  class UserTA extends mm.TableActions {
    t = mm.select(user.name).byID();
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  expect(
    v.whereSQLString,
    'SQL(E(Column(id, Table(user)), type = 1), E( = , type = 0), E(SQLVar(id, desc = Column(id, Table(user))), type = 2))',
  );
});

it('byID with inputName', () => {
  class UserTA extends mm.TableActions {
    t = mm.select(user.name).byID('haha');
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  expect(
    v.whereSQLString,
    'SQL(E(Column(id, Table(user)), type = 1), E( = , type = 0), E(SQLVar(haha, desc = Column(id, Table(user))), type = 2))',
  );
});

it('by', () => {
  class UserTA extends mm.TableActions {
    t = mm.select(user.name).by(user.snake_case_name);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  expect(
    v.whereSQLString,
    'SQL(E(Column(snake_case_name, Table(user)), type = 1), E( = , type = 0), E(SQLVar(snakeCaseName, desc = Column(snake_case_name, Table(user))), type = 2))',
  );
});

it('andBy', () => {
  class UserTA extends mm.TableActions {
    t1 = mm
      .select(user.name)
      .by(user.snake_case_name)
      .andBy(user.follower_count);
    t2 = mm.select(user.name).andBy(user.follower_count);
    t3 = mm
      .select(user.name)
      .byID()
      .andBy(user.follower_count);
  }
  const ta = mm.tableActions(user, UserTA);
  expect(
    ta.t1.whereSQLString,
    'SQL(E(Column(snake_case_name, Table(user)), type = 1), E( = , type = 0), E(SQLVar(snakeCaseName, desc = Column(snake_case_name, Table(user))), type = 2), E( AND , type = 0), E(SQLVar(followerCount, desc = Column(follower_count, Table(user))), type = 2))',
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
  const sc = mm.sel(mm.count('*'), 'c');
  class UserTA extends mm.TableActions {
    t = mm.selectField(user.name).byID();
    t2 = mm.selectField(sc);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;

  expect(v.mode, mm.SelectActionMode.field);
  expect(v.columns[0], user.name);

  const v2 = ta.t2;
  assert.deepEqual(v2.columns[0], sc);
});

it('Order by', () => {
  const cc = mm.sel('haha', 'name', new mm.ColumnType('int'));
  class UserTA extends mm.TableActions {
    t = mm
      .select(user.name, user.follower_count, cc)
      .byID()
      .orderByAsc(user.name)
      .orderByAsc(cc)
      .orderByDesc(user.follower_count);
  }
  const ta = mm.tableActions(user, UserTA);
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
  itThrows(() => {
    class UserTA extends mm.TableActions {
      t = mm.selectRows(
        t.name,
        (null as unknown) as mm.Column,
        t.follower_count,
      );
    }
    mm.tableActions(user, UserTA);
  }, 'The column at index 1 is null, action name "null"');

  itThrows(() => {
    class UserTA extends mm.TableActions {
      t = mm.selectRows(t.name, (32 as unknown) as mm.Column, t.follower_count);
    }
    mm.tableActions(user, UserTA);
  }, 'The column at index 1 is not a valid column, got a "number", action name "null"');
});

it('GROUP BY names', () => {
  const col = mm.sel(user.id, 'raw');
  class UserTA extends mm.TableActions {
    t = mm
      .selectRows(user.id, col)
      .groupBy(user.name, col, 'haha')
      .having(mm.sql`${mm.count(user.name)} > 2`)
      .orderByAsc(user.id);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  expect(v.groupByColumns[0], user.name.getDBName());
  expect(
    v.havingSQL,
    'SQL(E(SQLCall(3, return = ColType(SQL.INT), params = SQL(E(Column(name, Table(user)), type = 1))), type = 3), E( > 2, type = 0))',
  );
});

it('HAVING', () => {
  class UserTA extends mm.TableActions {
    t = mm
      .selectRows(user.id, user.name)
      .groupBy(user.name)
      .having(mm.sql`${mm.count(user.name)} > 2`)
      .orderByAsc(user.id);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  expect(v.groupByColumns[0], user.name.getDBName());
  expect(
    v.havingSQL,
    'SQL(E(SQLCall(3, return = ColType(SQL.INT), params = SQL(E(Column(name, Table(user)), type = 1))), type = 3), E( > 2, type = 0))',
  );
});

it('Throw when limit is called on non-list mode', () => {
  const t = user;

  itThrows(() => {
    class UserTA extends mm.TableActions {
      t = mm.selectField(t.name).limit();
    }
    mm.tableActions(user, UserTA);
  }, "limit can only be used when mode = 'SelectActionMode.list', current mode is 1");
});

it('Throw on selecting collection without ORDER BY', () => {
  const t = user;
  assert.doesNotThrow(() => {
    class UserTA extends mm.TableActions {
      t = mm.selectField(t.name);
    }
    mm.tableActions(user, UserTA);
  });
  assert.doesNotThrow(() => {
    class UserTA extends mm.TableActions {
      t = mm.select(t.name);
    }
    mm.tableActions(user, UserTA);
  });
  assert.doesNotThrow(() => {
    class UserTA extends mm.TableActions {
      t = mm.selectRows(t.name).orderByAsc(t.name);
    }
    mm.tableActions(user, UserTA);
  });
  assert.doesNotThrow(() => {
    class UserTA extends mm.TableActions {
      t = mm.selectPage(t.name).orderByAsc(t.name);
    }
    mm.tableActions(user, UserTA);
  });
  itThrows(() => {
    class UserTA extends mm.TableActions {
      t = mm.selectRows(t.name);
    }
    mm.tableActions(user, UserTA);
  }, 'An ORDER BY clause is required when selecting multiple rows [action "t"]');
  itThrows(() => {
    class UserTA extends mm.TableActions {
      t = mm.selectPage(t.name);
    }
    mm.tableActions(user, UserTA);
  }, 'An ORDER BY clause is required when selecting multiple rows [action "t"]');
});

it('Set action.__table via from()', () => {
  class UserTA extends mm.TableActions {
    t = mm.select(user.id, user.name);
    t2 = mm.select(post.id).from(post);
  }
  const ta = mm.tableActions(user, UserTA);
  expect(ta.t.__table, user);
  expect(ta.t2.__table, post);

  let [table] = ta.t.ensureInitialized();
  expect(table, user);
  [table] = ta.t2.ensureInitialized();
  expect(table, post);
});
