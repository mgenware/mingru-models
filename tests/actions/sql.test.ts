import * as dd from '../../';
import user from '../models/user';
import post from '../models/post';

test('SQL', () => {
  const sql = dd.sql`${user.id} = 1 OR ${user.name} = ${dd.input(user.name)}`;
  expect(sql.elements).toEqual([
    user.id,
    ' = 1 OR ',
    user.name,
    ' = ',
    dd.input(user.name),
  ]);
  expect(sql).toBeInstanceOf(dd.SQL);
});

test('SQL with input', () => {
  const sql = dd.sql`START${user.id} = 1 OR ${user.name} = ${dd.input(
    user.name,
  )}END`;
  expect(sql.elements).toEqual([
    'START',
    user.id,
    ' = 1 OR ',
    user.name,
    ' = ',
    dd.input(user.name),
    'END',
  ]);
});

test('Input', () => {
  const input = dd.input(user.name);
  expect(input.type).toBe(user.name);
  expect(input.name).toBe('userName');
});

test('Named input', () => {
  const input = dd.input(user.name, 'haha');
  expect(input.type).toBe(user.name);
  expect(input.name).toBe('haha');
});

test('Input (foreign key)', () => {
  const input = dd.input(post.user_id);
  expect(input.type).toBe(user.id);
  expect(input.name).toBe('postUserID');
});

test('Input (joined key)', () => {
  const input = dd.input(post.user_id.join(user).name);
  expect(input.type).toBe(user.name);
  expect(input.name).toBe('postUserName');
});

test('Raw type input', () => {
  const input = dd.input('uint32', 'uid');
  expect(input.type).toBe('uint32');
  expect(input.name).toBe('uid');
});

test('Empty name for raw type input', () => {
  expect(() => dd.input('uint32')).toThrow('empty input name');
});

test('Embed another sql', () => {
  const embedded = dd.sql`_${user.id} = ${dd.input(user.id)}`;
  const sql = dd.sql`START${embedded} OR ${user.name} = ${dd.input(user.name)}`;
  expect(sql.elements).toEqual([
    'START',
    '_',
    user.id,
    ' = ',
    dd.input(user.id),
    ' OR ',
    user.name,
    ' = ',
    dd.input(user.name),
  ]);
});

test('toInput', () => {
  const input = user.name.toInput();
  expect(input.type).toBe(user.name);
  expect(input.name).toBe('userName');
});

test('toInput(string)', () => {
  const input = user.name.toInput('haha');
  expect(input.type).toBe(user.name);
  expect(input.name).toBe('haha');
});

test('isEqualTo', () => {
  const sql = user.name.isEqualTo(dd.sql`"haha"`);
  expect(sql.elements).toEqual([user.name, ' = ', '"haha"']);
});

test('isEqualToInput', () => {
  const sql = user.name.isEqualToInput();
  expect(sql.elements).toEqual([user.name, ' = ', user.name.toInput()]);
});

test('isEqualToInput(string)', () => {
  const sql = user.name.isEqualToInput('haha');
  expect(sql.elements).toEqual([user.name, ' = ', user.name.toInput('haha')]);
});

test('isNotEqualTo', () => {
  const sql = user.name.isNotEqualTo(dd.sql`"haha"`);
  expect(sql.elements).toEqual([user.name, ' <> ', '"haha"']);
});

test('isNotEqualToInput', () => {
  const sql = user.name.isNotEqualToInput();
  expect(sql.elements).toEqual([user.name, ' <> ', user.name.toInput()]);
});

test('isNotEqualToInput(string)', () => {
  const sql = user.name.isNotEqualToInput('haha');
  expect(sql.elements).toEqual([user.name, ' <> ', user.name.toInput('haha')]);
});

test('isNull', () => {
  const sql = user.name.isNull();
  expect(sql.elements).toEqual([user.name, ' IS NULL']);
});

test('isNotNull', () => {
  const sql = user.name.isNotNull();
  expect(sql.elements).toEqual([user.name, ' IS NOT NULL']);
});
