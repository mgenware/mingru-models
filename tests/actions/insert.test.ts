import * as dd from '../../';
import user from '../models/user';
import post from '../models/post';

test('Insert', () => {
  const actions = dd.actions(post);
  const v = actions.insert('t').setInputs(post.title, post.snake_case_user_id);

  expect(v.type).toBe(dd.ActionType.insert);
  expect(v.name).toBe('InsertT');
  expect(v.fetchInsertedID).toBeFalsy();
  expect(v).toBeInstanceOf(dd.InsertAction);
  expect(v.table).toBe(post);
  expect(v.columnValueMap.size).toBe(2);

  const vTitle = v.columnValueMap.get(post.title) as dd.SQL;
  const vUserID = v.columnValueMap.get(post.snake_case_user_id) as dd.SQL;
  expect(vTitle.toString()).toBe('<postTitle: [title]>');
  expect(vUserID.toString()).toBe(
    '<postSnakeCaseUserID: [snake_case_user_id]>',
  );
});

test('Order of setInputs and set', () => {
  const actions = dd.actions(user);
  const v = actions
    .insert('t')
    .set(user.name, user.name.toInputSQL('a'))
    .setInputs(user.snake_case_name, user.name)
    .set(user.name, user.name.toInputSQL('b'));

  expect(v.columnValueMap.size).toBe(2);
  const vName = v.columnValueMap.get(user.name) as dd.SQL;
  const vSnakeName = v.columnValueMap.get(user.snake_case_name) as dd.SQL;

  expect(vName.toString()).toBe('<b: [name]>');
  expect(vSnakeName.toString()).toBe('<userSnakeCaseName: [snake_case_name]>');
});

test('Insert one', () => {
  const actions = dd.actions(post);
  const v = actions
    .insertOne('t')
    .setInputs(post.title, post.snake_case_user_id);

  expect(v.fetchInsertedID).toBeTruthy();
  expect(v.withDefaults).toBeFalsy();
});

test('Insert with defaults', () => {
  const actions = dd.actions(post);
  const v = actions
    .insertWithDefaults('t')
    .setInputs(post.title, post.snake_case_user_id);

  expect(v.fetchInsertedID).toBeFalsy();
  expect(v.withDefaults).toBeTruthy();
});

test('Insert one with defaults', () => {
  const actions = dd.actions(post);
  const v = actions
    .insertOneWithDefaults('t')
    .setInputs(post.title, post.snake_case_user_id);

  expect(v.fetchInsertedID).toBeTruthy();
  expect(v.withDefaults).toBeTruthy();
});
