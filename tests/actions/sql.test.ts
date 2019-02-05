import * as dd from '../../';
import user from '../models/user';
import post from '../models/post';
import { Column } from '../../';

test('SQL', () => {
  const sql = dd.sql`${user.id} = 1 OR ${user.name} = ${dd.input(user.name)}`;
  expect(sql.toString()).toBe('`id` = 1 OR `name` = <userName: [name]>');
  expect(sql).toBeInstanceOf(dd.SQL);
});

test('SQL with input', () => {
  const sql = dd.sql`START${user.id} = 1 OR ${user.name} = ${dd.input(
    user.name,
  )}END`;
  expect(sql.toString()).toBe(
    'START`id` = 1 OR `name` = <userName: [name]>END',
  );
});

test('Input', () => {
  const input = dd.input(user.name);
  expect(input.typeObject).toBe(user.name);
  expect(input.name).toBe('userName');
});

test('Named input', () => {
  const input = dd.input(user.name, 'haha');
  expect(input.typeObject).toBe(user.name);
  expect(input.name).toBe('haha');
});

test('Input (foreign key)', () => {
  const input = dd.input(post.user_id);
  expect((input.typeObject as Column).foreignColumn).toBe(user.id);
  expect(input.name).toBe('postUserID');
});

test('Input (joined key)', () => {
  const input = dd.input(post.user_id.join(user).name);
  expect((input.typeObject as dd.Column).mirroredColumn).toBe(user.name);
  expect(input.name).toBe('postUserName');
});

test('Raw type input', () => {
  const input = dd.input('uint32', 'uid');
  expect(input.typeObject).toBe('uint32');
  expect(input.name).toBe('uid');
});

test('Empty name for raw type input', () => {
  expect(() => dd.input('uint32')).toThrow('empty input name');
});

test('Embed another sql', () => {
  const embedded = dd.sql`_${user.id} = ${dd.input(user.id)}`;
  const sql = dd.sql`START${embedded} OR ${user.name} = ${dd.input(user.name)}`;
  expect(sql.toString()).toBe(
    'START_`id` = <userID: [id]> OR `name` = <userName: [name]>',
  );
});

test('Embed string', () => {
  const sql = dd.sql`${user.id} = ${'123'}`;
  expect(sql.toString()).toBe('`id` = 123');
});

test('toInput', () => {
  const input = user.name.toInput();
  expect(input.typeObject).toBe(user.name);
  expect(input.name).toBe('userName');
});

test('toInput(string)', () => {
  const input = user.name.toInput('haha');
  expect(input.typeObject).toBe(user.name);
  expect(input.name).toBe('haha');
});

test('toInputSQL(string)', () => {
  const sql = user.name.toInputSQL('haha');
  expect(sql).toBeInstanceOf(dd.SQL);
  expect(sql.toString()).toBe('<haha: [name]>');
});

test('isEqualTo', () => {
  const sql = user.name.isEqualTo(dd.sql`"haha"`);
  expect(sql.toString()).toBe('`name` = "haha"');
});

test('isEqualToInput', () => {
  const sql = user.name.isEqualToInput();
  expect(sql.toString()).toBe('`name` = <userName: [name]>');
});

test('isEqualToInput(string)', () => {
  const sql = user.name.isEqualToInput('haha');
  expect(sql.toString()).toBe('`name` = <haha: [name]>');
});

test('isNotEqualTo', () => {
  const sql = user.name.isNotEqualTo(dd.sql`"haha"`);
  expect(sql.toString()).toBe('`name` <> "haha"');
});

test('isNotEqualToInput', () => {
  const sql = user.name.isNotEqualToInput();
  expect(sql.toString()).toBe('`name` <> <userName: [name]>');
});

test('isNotEqualToInput(string)', () => {
  const sql = user.name.isNotEqualToInput('haha');
  expect(sql.toString()).toBe('`name` <> <haha: [name]>');
});

test('isNull', () => {
  const sql = user.name.isNull();
  expect(sql.toString()).toBe('`name` IS NULL');
});

test('isNotNull', () => {
  const sql = user.name.isNotNull();
  expect(sql.toString()).toBe('`name` IS NOT NULL');
});

test('makeSQL', () => {
  const s = dd.sql`haha`;
  expect(dd.convertToSQL(s)).toBe(s);
  expect(dd.convertToSQL('haha').toString()).toBe('haha');
  expect(dd.convertToSQL(post.user_id).toString()).toBe('`user_id`');
  expect(dd.convertToSQL(dd.count(post.user_id)).toString()).toBe(
    'CALL(3, `user_id`)',
  );
});
