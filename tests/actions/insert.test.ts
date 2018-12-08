import * as dd from '../../';
import post from '../models/post';

test('Insert', () => {
  const actions = dd.actions(post);
  const v = actions.insert('t', post.title, post.snake_case_user_id);

  expect(v.name).toBe('InsertT');
  expect(v.fetchInsertedID).toBeFalsy();
  expect(v).toBeInstanceOf(dd.InsertAction);
  expect(v).toBeInstanceOf(dd.Action);
  expect(v.table).toBe(post);
  expect(v.columns.length).toBe(2);
  expect(v.columns[0]).toBe(post.title);
  expect(v.columns[1]).toBe(post.snake_case_user_id);
  expect(v.type).toBe(dd.ActionType.insert);
});

test('Insert one', () => {
  const actions = dd.actions(post);
  const v = actions.insertOne('t', post.title, post.snake_case_user_id);

  expect(v.fetchInsertedID).toBeTruthy();
});
