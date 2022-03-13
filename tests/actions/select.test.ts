/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as assert from 'assert';
import { itThrows } from 'it-throws';
import * as mm from '../../dist/main.js';
import user from '../models/user.js';
import post from '../models/post.js';
import { eq, deepEq, ok } from '../assert-aliases.js';

it('select', () => {
  class UserTA extends mm.ActionGroup {
    t = mm.selectRow(user.id, user.name).whereSQL(mm.sql`${user.id} = 1`);
  }
  const ta = mm.actionGroup(user, UserTA);
  const v = ta.t;

  ok(v instanceof mm.SelectAction);
  ok(v instanceof mm.CoreSelectAction);
  ok(v instanceof mm.Action);
  const vd = v.__getData();
  eq(vd.columns?.length, 2);
  eq(vd.columns?.[0], user.id);
  eq(vd.columns?.[1], user.name);
  eq(v.__whereSQLString, '`Column(id, t=User(user)) = 1`');
  eq(vd.mode, mm.SelectActionMode.row);
  eq(vd.actionType, mm.ActionType.select);
  eq(v.toString(), 'SelectAction(t, t=User(user))');
});

it('where and whereSQL', () => {
  class UserTA extends mm.ActionGroup {
    t1 = mm.selectRow(user.id, user.name).whereSQL(mm.sql`${user.id} = 1`);
    t2 = mm.selectRow(user.id, user.name).where`${user.id} = 1`;
  }
  const ta = mm.actionGroup(user, UserTA);
  eq(ta.t1.__whereSQLString, '`Column(id, t=User(user)) = 1`');
  eq(ta.t2.__whereSQLString, '`Column(id, t=User(user)) = 1`');
});

it('Select *', () => {
  class UserTA extends mm.ActionGroup {
    t = mm.selectRow();
  }
  assert.doesNotThrow(() => mm.actionGroup(user, UserTA));
});

it('selectRows', () => {
  class UserTA extends mm.ActionGroup {
    t = mm
      .selectRows(user.id, user.name)
      .whereSQL(mm.sql`${user.id} = 1`)
      .orderByAsc(user.id);
  }
  const ta = mm.actionGroup(user, UserTA);
  const v = ta.t;
  const vd = v.__getData();
  eq(vd.mode, mm.SelectActionMode.rowList);
});

it('as', () => {
  const a = user.id.as('a');
  const b = user.name.as('b');
  const c = user.id.as('c');

  eq(a.__getData().selectedName, 'a');
  eq(b.__getData().selectedName, 'b');
  eq(c.__getData().selectedName, 'c');
});

it('SelectedColumn', () => {
  // as
  let c = user.id.as('x');
  let cd = c.__getData();
  eq(cd.selectedName, 'x');
  eq(cd.core, user.id);

  // new SelectedColumn
  c = new mm.SelectedColumn(user.id, 'y');
  cd = c.__getData();
  eq(cd.selectedName, 'y');
  eq(cd.core, user.id);

  // mm.sel
  c = mm.sel(user.id, 'x');
  cd = c.__getData();
  eq(cd.selectedName, 'x');
  eq(cd.core, user.id);

  // new SelectedColumn
  c = new mm.SelectedColumn(user.id);
  cd = c.__getData();
  eq(cd.selectedName, undefined);
  eq(cd.core, user.id);

  // mm.sel
  c = mm.sel(user.id, 'id');
  cd = c.__getData();
  eq(cd.selectedName, 'id');
  eq(cd.core, user.id);
});

it('SelectedColumn (raw SQL)', () => {
  const a = new mm.SelectedColumn(mm.sql`123`, 'x');
  const b = new mm.SelectedColumn(mm.sql`COUNT(${user.name})`, 'y');
  const ad = a.__getData();
  const bd = b.__getData();
  eq(ad.selectedName, 'x');
  eq(ad.core?.toString(), '`123`');
  eq(bd.selectedName, 'y');
  eq(bd.core?.toString(), '`COUNT(Column(name, t=User(user)))`');
});

it('SelectedColumn (types)', () => {
  const a = new mm.SelectedColumn(mm.sql`123`, 'x', new mm.ColumnType(['t1', 't2']));
  const ad = a.__getData();
  eq(ad.selectedName, 'x');
  eq(ad.core?.toString(), '`123`');
  deepEq(ad.type, new mm.ColumnType(['t1', 't2']));
});

it('SelectedColumn (count)', () => {
  class UserTA extends mm.ActionGroup {
    t = mm.selectRow(mm.sel(mm.sql`${mm.count(mm.sql`${post.user_id.join(user).name}`)}`, 'count'));
  }
  const ta = mm.actionGroup(user, UserTA);
  const v = ta.t;
  const vd = v.__getData();

  const cc = vd.columns?.[0] as mm.SelectedColumn;
  const ccd = cc.__getData();
  eq(ccd.selectedName, 'count');
  eq(ccd.core?.toString(), '`COUNT(`Column(name, t=JoinTable((J|1|post|user)[user_id|id]))`)`');
});

it('SelectedColumn (SQLConvertible)', () => {
  let cc = new mm.SelectedColumn(post.user_id, 't');
  let ccd = cc.__getData();
  // Column should not be wrapped in SQL
  eq(ccd.core, post.user_id);

  cc = new mm.SelectedColumn(mm.sql`str`, 't');
  ccd = cc.__getData();
  eq(ccd.core?.toString(), '`str`');

  cc = new mm.SelectedColumn(mm.sql`${mm.count(post.id)}`, 't');
  ccd = cc.__getData();
  eq(ccd.core?.toString(), '`COUNT(`Column(id, t=Post(post))`)`');
});

it('mm.select (types)', () => {
  const a = mm.sel(mm.sql`123`, 'x', new mm.ColumnType(['t1', 't2']));
  const ad = a.__getData();
  eq(ad.selectedName, 'x');
  eq(ad.core?.toString(), '`123`');
  deepEq(ad.type, new mm.ColumnType(['t1', 't2']));
});

it('byID', () => {
  class UserTA extends mm.ActionGroup {
    t = mm.selectRow(user.name).by(user.id);
  }
  const ta = mm.actionGroup(user, UserTA);
  const v = ta.t;
  eq(v.__whereSQLString, '`Column(id, t=User(user)) = VAR(Column(id, t=User(user)))`');
});

it('byID with inputName', () => {
  class UserTA extends mm.ActionGroup {
    t = mm.selectRow(user.name).by(user.id, 'haha');
  }
  const ta = mm.actionGroup(user, UserTA);
  const v = ta.t;
  eq(v.__whereSQLString, '`Column(id, t=User(user)) = VAR(Column(id, t=User(user)), name=haha)`');
});

it('by', () => {
  class UserTA extends mm.ActionGroup {
    t = mm.selectRow(user.name).by(user.snake_case_name);
  }
  const ta = mm.actionGroup(user, UserTA);
  const v = ta.t;
  eq(
    v.__whereSQLString,
    '`Column(snake_case_name, t=User(user)) = VAR(Column(snake_case_name, t=User(user)))`',
  );
});

it('andBy', () => {
  class UserTA extends mm.ActionGroup {
    t1 = mm.selectRow(user.name).by(user.snake_case_name).andBy(user.follower_count);
    t2 = mm.selectRow(user.name).andBy(user.follower_count);
    t3 = mm.selectRow(user.name).by(user.id).andBy(user.follower_count);
  }
  const ta = mm.actionGroup(user, UserTA);
  eq(
    ta.t1.__whereSQLString,
    '`(Column(snake_case_name, t=User(user)) = VAR(Column(snake_case_name, t=User(user))) AND VAR(Column(follower_count, t=User(user))))`',
  );
  eq(ta.t2.__whereSQLString, '`VAR(Column(follower_count, t=User(user)))`');
  eq(
    ta.t3.__whereSQLString,
    '`(Column(id, t=User(user)) = VAR(Column(id, t=User(user))) AND VAR(Column(follower_count, t=User(user))))`',
  );
});

it('selectField', () => {
  const sc = mm.sel(mm.sql`mm.count('*')`, 'c');
  class UserTA extends mm.ActionGroup {
    t = mm.selectField(user.name).by(user.id);
    t2 = mm.selectField(sc);
  }
  const ta = mm.actionGroup(user, UserTA);
  const v = ta.t;
  const vd = v.__getData();

  eq(vd.mode, mm.SelectActionMode.field);
  eq(vd.columns![0], user.name);

  const v2 = ta.t2;
  const v2d = v2.__getData();
  deepEq(v2d.columns![0], sc);
});

it('selectExists', () => {
  class UserTA extends mm.ActionGroup {
    t = mm.selectExists().by(user.id);
  }
  const ta = mm.actionGroup(user, UserTA);
  const v = ta.t;
  const vd = v.__getData();
  eq(vd.mode, mm.SelectActionMode.exists);
});

it('Order by', () => {
  const cc = mm.sel(mm.sql`haha`, 'name', new mm.ColumnType('int'));
  class UserTA extends mm.ActionGroup {
    t = mm
      .selectRow(user.name, user.follower_count, cc)
      .by(user.id)
      .orderByAsc(user.name)
      .orderByAsc(cc)
      .orderByDesc(user.follower_count)
      .orderByInput(user.name, user.id);
  }
  const ta = mm.actionGroup(user, UserTA);
  const v = ta.t;
  const vd = v.__getData();
  const orderByColumns = vd.orderByColumns!;

  eq(orderByColumns.length, 4);

  const order0 = orderByColumns[0] as mm.OrderByColumn;
  eq(order0.column, user.name);
  eq(order0.desc, false);

  const order1 = orderByColumns[1] as mm.OrderByColumn;
  eq(order1.column, cc);
  eq(order1.desc, false);

  const order2 = orderByColumns[2] as mm.OrderByColumn;
  eq(order2.column, user.follower_count);
  eq(order2.desc, true);

  const order3 = orderByColumns[3] as mm.OrderByColumnInput;
  deepEq(order3.columns, [user.name, user.id]);
});

it('Validate columns', () => {
  const t = user;
  itThrows(() => {
    class UserTA extends mm.ActionGroup {
      t = mm.selectRows(t.name, 32 as unknown as mm.Column, t.follower_count);
    }
    mm.actionGroup(user, UserTA);
  }, 'The column at index 1 is not valid, got "32", action "SelectAction(-)" [table "User(user)"]');
});

it('GROUP BY names', () => {
  const col = mm.sel(user.id, 'raw');
  class UserTA extends mm.ActionGroup {
    t = mm
      .selectRows(user.id, col)
      .groupBy(user.name, col, 'haha')
      .havingSQL(mm.sql`${mm.count(user.name)} > 2`)
      .orderByAsc(user.id);
  }
  const ta = mm.actionGroup(user, UserTA);
  const v = ta.t;
  const vd = v.__getData();

  eq(vd.groupByColumns![0], user.name.__getDBName());
  eq(vd.havingSQLValue!.toString(), '`COUNT(`Column(name, t=User(user))`) > 2`');
});

it('HAVING', () => {
  class UserTA extends mm.ActionGroup {
    t = mm.selectRows(user.id, user.name).groupBy(user.name).having`${mm.count(
      user.name,
    )} > 2`.orderByAsc(user.id);

    t2 = mm
      .selectRows(user.id, user.name)
      .groupBy(user.name)
      .havingSQL(mm.sql`${mm.count(user.name)} > 2`)
      .orderByAsc(user.id);
  }
  const ta = mm.actionGroup(user, UserTA);
  const v = ta.t;
  const vd = v.__getData();

  eq(vd.groupByColumns![0], user.name.__getDBName());
  eq(vd.havingSQLValue!.toString(), '`COUNT(`Column(name, t=User(user))`) > 2`');
  eq(ta.t2.__getData().havingSQLValue!.toString(), '`COUNT(`Column(name, t=User(user))`) > 2`');
});

it('Pagination', () => {
  class UserTA extends mm.ActionGroup {
    t = mm.selectRows(user.name).paginate().orderByAsc(user.name);
  }
  const ta = mm.actionGroup(user, UserTA);
  eq(ta.t.__getData().paginationMode === mm.SelectActionPaginationMode.pagination, true);
});

it('PageMode', () => {
  class UserTA extends mm.ActionGroup {
    t = mm.selectRows(user.name).pageMode().orderByAsc(user.name);
  }
  const ta = mm.actionGroup(user, UserTA);
  eq(ta.t.__getData().paginationMode === mm.SelectActionPaginationMode.pageMode, true);
});

it('LIMIT n OFFSET', () => {
  class UserTA extends mm.ActionGroup {
    t = mm.selectRows(user.name).limit().orderByAsc(user.name);
  }
  const ta = mm.actionGroup(user, UserTA);
  const vd = ta.t.__getData();
  eq(vd.paginationMode === mm.SelectActionPaginationMode.limitOffset, true);
});

it('LIMIT (custom value)', () => {
  class UserTA extends mm.ActionGroup {
    t = mm.selectRows(user.name).orderByAsc(user.name).limit(20);
  }
  const ta = mm.actionGroup(user, UserTA);
  const vd = ta.t.__getData();
  eq(vd.paginationMode === mm.SelectActionPaginationMode.limitOffset, true);
  eq(vd.limitValue, 20);
});

it('LIMIT and OFFSET (custom value)', () => {
  class UserTA extends mm.ActionGroup {
    t = mm
      .selectRows(user.name)
      .orderByAsc(user.name)
      .limit(new mm.SQLVariable(mm.int(), 'limit'))
      .offset(12);
  }
  const ta = mm.actionGroup(user, UserTA);
  const vd = ta.t.__getData();
  eq(vd.paginationMode === mm.SelectActionPaginationMode.limitOffset, true);
  eq(vd.limitValue?.toString(), 'VAR(Column(-), name=limit)');
  eq(vd.offsetValue, 12);
});

it('Throw when paginate is called on non-list mode', () => {
  const t = user;

  itThrows(() => {
    class UserTA extends mm.ActionGroup {
      t = mm.selectField(t.name).paginate();
    }
    mm.actionGroup(user, UserTA);
  }, '`paginationMode` can only be set for `.rowList` and `.fieldList` modes [table "User(user)"]');
});

it('Throw on selecting collection without ORDER BY', () => {
  const t = user;
  assert.doesNotThrow(() => {
    class UserTA extends mm.ActionGroup {
      t = mm.selectField(t.name);
    }
    mm.actionGroup(user, UserTA);
  });
  assert.doesNotThrow(() => {
    class UserTA extends mm.ActionGroup {
      t = mm.selectRow(t.name);
    }
    mm.actionGroup(user, UserTA);
  });
  assert.doesNotThrow(() => {
    class UserTA extends mm.ActionGroup {
      t = mm.selectRows(t.name).orderByAsc(t.name);
    }
    mm.actionGroup(user, UserTA);
  });
  assert.doesNotThrow(() => {
    class UserTA extends mm.ActionGroup {
      t = mm.selectRows(t.name).orderByAsc(t.name).paginate();
    }
    mm.actionGroup(user, UserTA);
  });
  itThrows(() => {
    class UserTA extends mm.ActionGroup {
      t = mm.selectRows(t.name);
    }
    mm.actionGroup(user, UserTA);
  }, 'An ORDER BY clause is required when selecting multiple rows [action "t"] [table "User(user)"]');
  assert.doesNotThrow(() => {
    class UserTA extends mm.ActionGroup {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      t = mm.selectRows(t.name).noOrderBy;
    }
    mm.actionGroup(user, UserTA);
  }, 'An ORDER BY clause is required when selecting multiple rows [action "t"] [table "Table(user)"]');
  itThrows(() => {
    class UserTA extends mm.ActionGroup {
      t = mm.selectRows(t.name).paginate();
    }
    mm.actionGroup(user, UserTA);
  }, 'An ORDER BY clause is required when selecting multiple rows [action "t"] [table "User(user)"]');
});

it('Set action.__table via from()', () => {
  class UserTA extends mm.ActionGroup {
    t = mm.selectRow(user.id, user.name);
    t2 = mm.selectRow(post.id).from(post);
  }
  const ta = mm.actionGroup(user, UserTA);
  const td = ta.t.__getData();
  const t2d = ta.t2.__getData();
  eq(td.sqlTable, undefined);
  eq(td.groupTable, user);
  eq(t2d.sqlTable, post);
  eq(t2d.groupTable, user);

  let table = ta.t.__mustGetAvailableSQLTable(null);
  eq(table, user);
  table = ta.t2.__mustGetAvailableSQLTable(null);
  eq(table, post);
});

it('Subquery', () => {
  class PostTA extends mm.ActionGroup {
    t = mm.selectRow(post.title).where`${post.user_id.isEqualTo`${mm
      .selectRow(mm.max(user.id).toColumn('maxID'))
      .from(user)}`}`;
  }
  const ta = mm.actionGroup(post, PostTA);
  eq(ta.t.__whereSQLString, '`Column(user_id, t=Post(post)) = SelectAction(-, ft=User(user))`');
});

it('Select DISTINCT', () => {
  class UserTA extends mm.ActionGroup {
    t1 = mm.selectRow();
    t2 = mm.selectRow().distinct();
  }
  const ta = mm.actionGroup(user, UserTA);
  eq(ta.t1.__getData().distinctFlag, undefined);
  eq(ta.t2.__getData().distinctFlag, true);
});

it('UNION', () => {
  const t1 = mm.selectRow(user.id).from(user);
  const t2 = mm.selectRow();
  const t3 = mm.selectRow();
  const t1t2 = t1.union(t2).orderByAsc(user.id);
  class UserTA extends mm.ActionGroup {
    t = t1t2.unionAll(t3).orderByAsc(user.id).paginate();
  }
  const ta = mm.actionGroup(user, UserTA);
  const { t } = ta;
  ok(t1t2 instanceof mm.SelectAction);
  const t1t2d = t1t2.__getData();
  ok(t1t2d.mode === mm.SelectActionMode.rowList);
  eq(t1t2d.sqlTable, t1.__getData().sqlTable);
  eq(t1t2d.sqlTable, user);
  eq(t1t2d.unionMembers![0], t1);
  eq(t1t2d.unionMembers![1], t2);
  eq(t1t2d.unionAllFlag, false);

  const td = t.__getData();
  eq(td.unionMembers![0], t1t2);
  ok(td.paginationMode === mm.SelectActionPaginationMode.pagination);
  eq(td.unionMembers![1], t3);
  eq(td.unionAllFlag, true);
  eq(td.sqlTable, t1.__getData().sqlTable);
  eq(td.sqlTable, user);
});

it('UNION on a ghost table', () => {
  const t1 = mm.selectRow(user.id).from(user);
  const t2 = mm.selectRow();
  class UserTA extends mm.ActionGroup {
    t = t1.union(t2).orderByAsc(user.id);
  }
  const ta = mm.actionGroup(mm.ghostTable, UserTA);
  const { t } = ta;
  const td = t.__getData();
  eq(td.unionMembers![0], t1);
  eq(td.unionMembers![1], t2);
  eq(td.name, 't');
  eq(td.groupTable, mm.ghostTable);
  eq(td.sqlTable, user);
});

it('mm.select == mm.selectRow', () => {
  eq(mm.select, mm.selectRow);
});

it('noOrderByFlag', () => {
  class UserTA extends mm.ActionGroup {
    t1 = mm.selectRow();
    t2 = mm.selectRow().noOrderBy();
  }
  const ta = mm.actionGroup(user, UserTA);
  eq(ta.t1.__getData().noOrderByFlag, undefined);
  eq(ta.t2.__getData().noOrderByFlag, true);
});

it('Lock mode', () => {
  class UserTA extends mm.ActionGroup {
    t1 = mm.selectRow();
    t2 = mm.selectRow().lock(mm.SelectActionLockMode.forUpdate);
    t3 = mm.selectRow().lock(mm.SelectActionLockMode.inShareMode);
  }
  const ta = mm.actionGroup(user, UserTA);
  eq(ta.t1.__getData().lockMode, undefined);
  eq(ta.t2.__getData().lockMode, mm.SelectActionLockMode.forUpdate);
  eq(ta.t3.__getData().lockMode, mm.SelectActionLockMode.inShareMode);
});
