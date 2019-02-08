import * as dd from '../../';
import user from '../models/user';

test('Delete', () => {
  const actions = dd.actions(user);
  const v = actions.delete('t').where(dd.sql`${user.id} = 1`);

  expect(v.name).toBe('DeleteT');
  expect(v.table).toBe(user);
  expect(v).toBeInstanceOf(dd.DeleteAction);
  expect(v).toBeInstanceOf(dd.Action);
  expect(v.whereSQL).not.toBeNull();
  expect(v.type).toBe(dd.ActionType.delete);

  // extra props
  expect(v.checkAffectedRows).toBe(false);
  expect(v.deleteAll).toBe(false);
});

test('Delete without where', () => {
  const actions = dd.actions(user);
  const v = actions.delete('t');

  expect(v.name).toBe('DeleteT');
  expect(v.table).toBe(user);
});

test('DeleteOne', () => {
  const actions = dd.actions(user);
  const v = actions.deleteOne('t').where(dd.sql`${user.id} = 1`);

  // extra props
  expect(v.checkAffectedRows).toBe(true);
  expect(v.deleteAll).toBe(false);
});

test('DeleteAll', () => {
  const actions = dd.actions(user);
  const v = actions.deleteAll('t');

  // extra props
  expect(v.checkAffectedRows).toBe(false);
  expect(v.deleteAll).toBe(true);
});

test('DeleteAll and where', () => {
  const actions = dd.actions(user);
  expect(() => actions.deleteAll('t').byID()).toThrow('cannot');
});

test('ByID', () => {
  const actions = dd.actions(user);
  const v = actions.deleteOne('t').byID();

  expect(v.whereSQL!.toString()).toBe('`id` = <id: [id]>');
});
