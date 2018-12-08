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
  expect(vTitle).toEqual(post.title.toInputSQL());
  expect(vUserID).toEqual(post.snake_case_user_id.toInputSQL());
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

  expect(vName).toEqual(user.name.toInputSQL('b'));
  expect(vSnakeName).toEqual(user.snake_case_name.toInputSQL());
});

test('Insert one', () => {
  const actions = dd.actions(post);
  const v = actions
    .insertOne('t')
    .setInputs(post.title, post.snake_case_user_id);

  expect(v.fetchInsertedID).toBeTruthy();
});
