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
  expect(v.selectAll).toBe(false);
  expect(v.type).toBe(dd.ActionType.select);
});

test('SelectAll', () => {
  const actions = dd.actions(user);
  const v = actions
    .selectAll('t', user.id, user.name)
    .where(dd.sql`${user.id} = 1`);

  expect(v.selectAll).toBe(true);
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
