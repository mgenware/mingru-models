import * as dd from '../../';
import user from '../models/user';
import post from '../models/post';

test('Select and from', () => {
  const actions = dd.actions(user);
  const v = actions
    .select('t', user.id, user.name)
    .where(dd.sql`${user.id} = 1`);

  expect(v.name).toBe('SelectT');
  expect(v).toBeInstanceOf(dd.SelectAction);
  expect(v).toBeInstanceOf(dd.Action);
  expect(v.columns.length).toBe(2);
  expect(v.columns[0]).toBe(user.id);
  expect(v.columns[1]).toBe(user.name);
  expect(v.table).toBe(user);
  expect(v.whereSQL).not.toBeNull();
  expect(v.isSelectAll).toBe(false);
  expect(v.type).toBe(dd.ActionType.select);
});

test('SelectAll', () => {
  const actions = dd.actions(user);
  const v = actions
    .selectAll('t', user.id, user.name)
    .where(dd.sql`${user.id} = 1`);

  expect(v.isSelectAll).toBe(true);
});

test('as', () => {
  const a = user.id.as('a');
  const b = user.name.as('b');
  const c = user.id.as('c');

  expect(a).toBeInstanceOf(dd.CalculatedColumn);
  expect(a.selectedName).toBe('a');
  expect(b.selectedName).toBe('b');
  expect(c.selectedName).toBe('c');
});

test('CalculatedColumn', () => {
  const a = user.id.as('x');
  const b = new dd.CalculatedColumn(user.id, 'y');
  expect(a.selectedName).toBe('x');
  expect(a.core).toBe(user.id);
  expect(b.selectedName).toBe('y');
  expect(b.core).toBe(user.id);
});

test('CalculatedColumn (raw SQL)', () => {
  const a = new dd.CalculatedColumn(dd.sql`123`, 'x');
  const b = new dd.CalculatedColumn(dd.sql`COUNT(${user.name})`, 'y');
  expect(a.selectedName).toBe('x');
  expect(a.core.toString()).toBe('123');
  expect(b.selectedName).toBe('y');
  expect(b.core.toString()).toBe('COUNT(`name`)');
});

test('CalculatedColumn (types)', () => {
  const a = new dd.CalculatedColumn(
    dd.sql`123`,
    'x',
    new dd.ColumnType(['t1', 't2']),
  );
  expect(a.selectedName).toBe('x');
  expect(a.core.toString()).toBe('123');
  expect(a.type).toEqual(new dd.ColumnType(['t1', 't2']));
});

test('CalculatedColumn (count)', () => {
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

test('dd.select (types)', () => {
  const a = dd.select(dd.sql`123`, 'x', new dd.ColumnType(['t1', 't2']));
  expect(a.selectedName).toBe('x');
  expect(a.core.toString()).toBe('123');
  expect(a.type).toEqual(new dd.ColumnType(['t1', 't2']));
});

test('ByID', () => {
  const actions = dd.actions(user);
  const v = actions.select('t', user.name).byID();

  expect(v.whereSQL!.toString()).toBe('`id` = <userID: [id]>');
});

test('SelectField', () => {
  const actions = dd.actions(user);
  const v = actions.selectField('t', user.name).byID();

  expect(v.isSelectAll).toBe(false);
  expect(v.isSelectField).toBe(true);
});

test('Order by', () => {
  const actions = dd.actions(user);
  const v = actions
    .select('t', user.name, user.follower_count)
    .byID()
    .orderBy(user.name)
    .orderByDesc(user.follower_count);

  expect(v.orderByColumns.length).toBe(2);
  expect(v.orderByColumns[0]).toBeInstanceOf(dd.ColumnName);
  expect(v.orderByColumns[0].columnName).toBe('name');
  expect(v.orderByColumns[0].desc).toBe(false);
  expect(v.orderByColumns[1].columnName).toBe('follower_count');
  expect(v.orderByColumns[1].desc).toBe(true);
});

test('Group by', () => {
  const actions = dd.actions(user);
  const v = actions
    .select('t', user.name, user.follower_count)
    .byID()
    .groupBy(user.name);

  expect(v.groupByColumns.length).toBe(1);
  expect(v.groupByColumns[0]).toBeInstanceOf(dd.ColumnName);
  expect(v.groupByColumns[0].columnName).toBe('name');
});
