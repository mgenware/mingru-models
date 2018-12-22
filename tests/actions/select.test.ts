import * as dd from '../../';
import user from '../models/user';

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
  const d = c.as('d');

  expect(a).toBeInstanceOf(dd.SelectedColumn);
  expect(a.selectedName).toBe('a');
  expect(b.selectedName).toBe('b');
  expect(c.selectedName).toBe('c');
  expect(d.selectedName).toBe('d');
});

test('SelectedColumn', () => {
  const a = user.id
    .as('a')
    .as('b')
    .as('c');
  const b = new dd.SelectedColumn(a, 'b');
  expect(a.selectedName).toBe('c');
  expect(a.__getTargetColumn()).toBe(user.id);
  expect(b.selectedName).toBe('b');
  expect(b.__getTargetColumn()).toBe(user.id);
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
  expect(v.orderByColumns[0]).toBeInstanceOf(dd.OrderBy);
  expect(v.orderByColumns[0].column).toBe(user.name);
  expect(v.orderByColumns[0].desc).toBe(false);
  expect(v.orderByColumns[1].column).toBe(user.follower_count);
  expect(v.orderByColumns[1].desc).toBe(true);
});
