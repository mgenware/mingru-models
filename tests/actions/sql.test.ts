import * as dd from '../../';
import user from '../models/user';
import post from '../models/post';
import { Column } from '../../';

it('SQL', () => {
  const sql = dd.sql`${user.id} = 1 OR ${user.name} = ${dd.input(user.name)}`;
  expect(sql.toString()).toBe('`id` = 1 OR `name` = <name: [name]>');
  expect(sql).toBeInstanceOf(dd.SQL);
});

it('SQL with input', () => {
  const sql = dd.sql`START${user.id} = 1 OR ${user.name} = ${dd.input(
    user.name,
  )}END`;
  expect(sql.toString()).toBe('START`id` = 1 OR `name` = <name: [name]>END');
});

it('Input', () => {
  const input = dd.input(user.name);
  expect(input.type).toBe(user.name);
  expect(input.name).toBe('name');
});

it('Named input', () => {
  const input = dd.input(user.name, 'haha');
  expect(input.type).toBe(user.name);
  expect(input.name).toBe('haha');
});

it('Input (foreign key)', () => {
  const input = dd.input(post.user_id);
  expect((input.type as Column).foreignColumn).toBe(user.id);
  expect(input.name).toBe('userID');
});

it('Input (joined key)', () => {
  const input = dd.input(post.user_id.join(user).name);
  expect((input.type as dd.Column).mirroredColumn).toBe(user.name);
  expect(input.name).toBe('userName');
});

it('Raw type input', () => {
  const input = dd.input('uint32', 'uid');
  expect(input.type).toBe('uint32');
  expect(input.name).toBe('uid');
});

it('Empty name for raw type input', () => {
  expect(() => dd.input('uint32')).toThrow('empty input name');
});

it('Embed another sql', () => {
  const embedded = dd.sql`_${user.id} = ${dd.input(user.id)}`;
  const sql = dd.sql`START${embedded} OR ${user.name} = ${dd.input(user.name)}`;
  expect(sql.toString()).toBe(
    'START_`id` = <id: [id]> OR `name` = <name: [name]>',
  );
});

it('Embed string', () => {
  const sql = dd.sql`${user.id} = ${'123'}`;
  expect(sql.toString()).toBe('`id` = 123');
});

it('toInput', () => {
  const input = user.name.toInput();
  expect(input.type).toBe(user.name);
  expect(input.name).toBe('name');
});

it('toInput(string)', () => {
  const input = user.name.toInput('haha');
  expect(input.type).toBe(user.name);
  expect(input.name).toBe('haha');
});

it('isEqualTo', () => {
  const sql = user.name.isEqualTo(dd.sql`"haha"`);
  expect(sql.toString()).toBe('`name` = "haha"');
});

it('isEqualToInput', () => {
  const sql = user.name.isEqualToInput();
  expect(sql.toString()).toBe('`name` = <name: [name]>');
});

it('isEqualToInput(string)', () => {
  const sql = user.name.isEqualToInput('haha');
  expect(sql.toString()).toBe('`name` = <haha: [name]>');
});

it('isNotEqualTo', () => {
  const sql = user.name.isNotEqualTo(dd.sql`"haha"`);
  expect(sql.toString()).toBe('`name` <> "haha"');
});

it('isNotEqualToInput', () => {
  const sql = user.name.isNotEqualToInput();
  expect(sql.toString()).toBe('`name` <> <name: [name]>');
});

it('isNotEqualToInput(string)', () => {
  const sql = user.name.isNotEqualToInput('haha');
  expect(sql.toString()).toBe('`name` <> <haha: [name]>');
});

it('isNull', () => {
  const sql = user.name.isNull();
  expect(sql.toString()).toBe('`name` IS NULL');
});

it('isNotNull', () => {
  const sql = user.name.isNotNull();
  expect(sql.toString()).toBe('`name` IS NOT NULL');
});

it('makeSQL', () => {
  const s = dd.sql`haha`;
  expect(dd.convertToSQL(s)).toBe(s);
  expect(dd.convertToSQL('haha').toString()).toBe('haha');
  expect(dd.convertToSQL(post.user_id).toString()).toBe('`user_id`');
  expect(dd.convertToSQL(dd.count(post.user_id)).toString()).toBe(
    'CALL(3, `user_id`)',
  );
});

it('findColumn', () => {
  let s = dd.sql`haha`;
  expect(s.findColumn()).toBeNull();
  s = dd.sql`kaokdjdf ${user.name}`;
  expect(s.findColumn()).toBe(user.name);
  s = dd.sql`${dd.coalesce('haha', user.name)}`;
  expect(s.findColumn()).toBe(user.name);
});

it('Input.isEqualTo', () => {
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

it('hasColumns', () => {
  const a = dd.sql`sdf sd ${dd.datetimeNow()}`;
  const b = dd.sql`sisjsdf`;
  const c = dd.sql`jis df${user.id}`;
  const d = dd.sql`isjdf${user.name.toInput()}`;
  expect(a.hasColumns).toBe(false);
  expect(b.hasColumns).toBe(false);
  expect(c.hasColumns).toBe(true);
  expect(d.hasColumns).toBe(true);
});

it('hasCalls', () => {
  const a = dd.sql`sdf sd ${dd.datetimeNow()}`;
  const b = dd.sql`sisjsdf`;
  const c = dd.sql`jis df${user.id}`;
  const d = dd.sql`isjdf${user.name.toInput()}`;
  expect(a.hasCalls).toBe(true);
  expect(b.hasCalls).toBe(false);
  expect(c.hasCalls).toBe(false);
  expect(d.hasCalls).toBe(false);
});
