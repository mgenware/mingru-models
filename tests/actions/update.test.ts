import * as dd from '../../';
import user from '../models/user';

test('Update', () => {
  const actions = dd.actions(user);
  const v = actions
    .update('t')
    .set(user.name, dd.sql`${dd.input(user.name)}`)
    .set(user.follower_count, dd.sql`${user.follower_count} + 1`)
    .where(dd.sql`${user.id} = 1`);

  expect(v.type).toBe(dd.ActionType.update);
  expect(v.name).toBe('UpdateT');
  expect(v).toBeInstanceOf(dd.UpdateAction);
  expect(v).toBeInstanceOf(dd.Action);
  expect(v.table).toBe(user);
  expect(v.whereSQL).not.toBeNull();
  expect(v.columnValueMap.size).toBe(2);

  // extra props
  expect(v.checkAffectedRows).toBe(false);
  expect(v.updateAll).toBe(false);

  const vName = v.columnValueMap.get(user.name) as dd.SQL;
  const vSnakeName = v.columnValueMap.get(user.snake_case_name) as dd.SQL;
  expect(vName).not.toBeNull();
  expect(vSnakeName).not.toBeNull();
});

test('Update without where', () => {
  const actions = dd.actions(user);
  const v = actions
    .update('t')
    .set(user.name, dd.sql`${dd.input(user.name)}`)
    .set(user.follower_count, dd.sql`${user.follower_count} + 1`);

  expect(v.name).toBe('UpdateT');
  expect(v.table).toBe(user);
  const vName = v.columnValueMap.get(user.name) as dd.SQL;
  const vSnakeName = v.columnValueMap.get(user.snake_case_name) as dd.SQL;
  expect(vName).not.toBeNull();
  expect(vSnakeName).not.toBeNull();
});

test('Order of setInputs and set', () => {
  const actions = dd.actions(user);
  const v = actions
    .update('t')
    .set(user.name, user.name.toInputSQL('a'))
    .setInputs(user.snake_case_name, user.name)
    .set(user.name, user.name.toInputSQL('b'));

  expect(v.columnValueMap.size).toBe(2);

  const vName = v.columnValueMap.get(user.name) as dd.SQL;
  const vSnakeName = v.columnValueMap.get(user.snake_case_name) as dd.SQL;

  expect(vName.toString()).toBe('<b: [name]>');
  expect(vSnakeName.toString()).toBe('<userSnakeCaseName: [snake_case_name]>');
});

test('updateOne', () => {
  const actions = dd.actions(user);
  const v = actions.updateOne('t').setInputs(user.snake_case_name);

  // extra props
  expect(v.checkAffectedRows).toBe(true);
  expect(v.updateAll).toBe(false);
});

test('updateAll', () => {
  const actions = dd.actions(user);
  const v = actions.updateAll('t').setInputs(user.snake_case_name);

  // extra props
  expect(v.checkAffectedRows).toBe(false);
  expect(v.updateAll).toBe(true);
});

test('ByID', () => {
  const actions = dd.actions(user);
  const v = actions
    .updateOne('t')
    .setInputs(user.snake_case_name)
    .byID();

  expect(v.whereSQL!.toString()).toBe('`id` = <userID: [id]>');
});
