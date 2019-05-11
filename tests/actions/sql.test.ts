import * as dd from '../../';
import user from '../models/user';
import post from '../models/post';
import { Column } from '../../';

test('SQL', () => {
  const sql = dd.sql`${user.id} = 1 OR ${user.name} = ${dd.input(user.name)}`;
  expect(sql.toString()).toBe('`id` = 1 OR `name` = <name: [name]>');
  expect(sql).toBeInstanceOf(dd.SQL);
});

test('SQL with input', () => {
  const sql = dd.sql`START${user.id} = 1 OR ${user.name} = ${dd.input(
    user.name,
  )}END`;
  expect(sql.toString()).toBe('START`id` = 1 OR `name` = <name: [name]>END');
});

test('Input', () => {
  const input = dd.input(user.name);
  expect(input.typeObject).toBe(user.name);
  expect(input.name).toBe('name');
});

test('Named input', () => {
  const input = dd.input(user.name, 'haha');
  expect(input.typeObject).toBe(user.name);
  expect(input.name).toBe('haha');
});

test('Input (foreign key)', () => {
  const input = dd.input(post.user_id);
  expect((input.typeObject as Column).foreignColumn).toBe(user.id);
  expect(input.name).toBe('userID');
});

test('Input (joined key)', () => {
  const input = dd.input(post.user_id.join(user).name);
  expect((input.typeObject as dd.Column).mirroredColumn).toBe(user.name);
  expect(input.name).toBe('userName');
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
    'START_`id` = <id: [id]> OR `name` = <name: [name]>',
  );
});

test('Embed string', () => {
  const sql = dd.sql`${user.id} = ${'123'}`;
  expect(sql.toString()).toBe('`id` = 123');
});

test('toInput', () => {
  const input = user.name.toInput();
  expect(input.typeObject).toBe(user.name);
  expect(input.name).toBe('name');
});

test('toInput(string)', () => {
  const input = user.name.toInput('haha');
  expect(input.typeObject).toBe(user.name);
  expect(input.name).toBe('haha');
});

test('isEqualTo', () => {
  const sql = user.name.isEqualTo(dd.sql`"haha"`);
  expect(sql.toString()).toBe('`name` = "haha"');
});

test('isEqualToInput', () => {
  const sql = user.name.isEqualToInput();
  expect(sql.toString()).toBe('`name` = <name: [name]>');
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
  expect(sql.toString()).toBe('`name` <> <name: [name]>');
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

test('findColumn', () => {
  let s = dd.sql`haha`;
  expect(s.findColumn()).toBeNull();
  s = dd.sql`kaokdjdf ${user.name}`;
  expect(s.findColumn()).toBe(user.name);
  s = dd.sql`${dd.coalesce('haha', user.name)}`;
  expect(s.findColumn()).toBe(user.name);
});

test('Input.isEqualTo', () => {
  const a = user.id.toInput();
  const b = user.id.toInput();
  const c = dd.input('a', 'id');
  const d = dd.input('a', 'id');
  const e = dd.input('b', 'id');
  expect(a.name).toBe(c.name);
  expect(a.isEqualTo(b)).toBe(true);
  expect(a.isEqualTo(c)).toBe(false);
  expect(c.isEqualTo(d)).toBe(true);
  expect(c.isEqualTo(e)).toBe(false);
});

test('InputList', () => {
  const i1 = dd.input(user.id);
  const i2 = user.name.toInput();
  const sql1 = dd.sql`${user.name} = ${i2} ${dd.input('a', 'b')}`;
  const i3 = dd.input(user.snake_case_name);
  const sql2 = dd.sql`_${user.id} = ${i1} AND ${sql1}`;
  const i4 = dd.input('a', 'b');
  const sql = dd.sql`START${sql2} OR ${
    user.snake_case_name
  } = ${i3} = ${dd.input(user.snake_case_name)} ${i4}`;
  expect(sql.inputs.list).toEqual([i1, i2, i4, i3]);
  expect(sql.inputs.sealed).toBe(true);
});

test('InputList (conflicting names)', () => {
  expect(() => {
    // tslint:disable-next-line no-unused-expression
    dd.sql`START${dd.sql`${user.id.toInput()}`} OR ${
      user.snake_case_name
    } = ${dd.sql`${post.id.toInput()}`}`;
  }).toThrow('id');
  expect(() => {
    // tslint:disable-next-line no-unused-expression
    dd.sql`${user.id.toInput()}${dd.input('b', 'id')}`;
  }).toThrow('id');
  expect(() => {
    // tslint:disable-next-line no-unused-expression
    dd.sql`${dd.input('a', 'v1')}${dd.input('b', 'v1')}`;
  }).toThrow('v1');
});
