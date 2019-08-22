import * as dd from '../../';
import user from '../models/user';
import post from '../models/post';
import { Column } from '../../';
import * as assert from 'assert';

const expect = assert.equal;
const ok = assert.ok;

it('SQL', () => {
  const sql = dd.sql`${user.id} = 1 OR ${user.name} = ${dd.input(user.name)}`;
  expect(sql.toString(), '`id` = 1 OR `name` = <name: [name]>');
  ok(sql instanceof dd.SQL);
});

it('SQL with input', () => {
  const sql = dd.sql`START${user.id} = 1 OR ${user.name} = ${dd.input(
    user.name,
  )}END`;
  expect(sql.toString(), 'START`id` = 1 OR `name` = <name: [name]>END');
});

it('Input', () => {
  const input = dd.input(user.name);
  expect(input.type, user.name);
  expect(input.name, 'name');
});

it('Named input', () => {
  const input = dd.input(user.name, 'haha');
  expect(input.type, user.name);
  expect(input.name, 'haha');
});

it('Input (foreign key)', () => {
  const input = dd.input(post.user_id);
  expect((input.type as Column).foreignColumn, user.id);
  expect(input.name, 'userID');
});

it('Input (joined key)', () => {
  const input = dd.input(post.user_id.join(user).name);
  expect((input.type as dd.Column).mirroredColumn, user.name);
  expect(input.name, 'userName');
});

it('Raw type input', () => {
  const input = dd.input('uint32', 'uid');
  expect(input.type, 'uint32');
  expect(input.name, 'uid');
});

it('Empty name for raw type input', () => {
  assert.throws(() => dd.input('uint32'), 'empty input name');
});

it('Embed another sql', () => {
  const embedded = dd.sql`_${user.id} = ${dd.input(user.id)}`;
  const sql = dd.sql`START${embedded} OR ${user.name} = ${dd.input(user.name)}`;
  expect(sql.toString(), 'START_`id` = <id: [id]> OR `name` = <name: [name]>');
});

it('Embed string', () => {
  const sql = dd.sql`${user.id} = ${'123'}`;
  expect(sql.toString(), '`id` = 123');
});

it('toInput', () => {
  const input = user.name.toInput();
  expect(input.type, user.name);
  expect(input.name, 'name');
});

it('toInput(string)', () => {
  const input = user.name.toInput('haha');
  expect(input.type, user.name);
  expect(input.name, 'haha');
});

it('isEqualTo', () => {
  const sql = user.name.isEqualTo(dd.sql`"haha"`);
  expect(sql.toString(), '`name` = "haha"');
});

it('isEqualToInput', () => {
  const sql = user.name.isEqualToInput();
  expect(sql.toString(), '`name` = <name: [name]>');
});

it('isEqualToInput(string)', () => {
  const sql = user.name.isEqualToInput('haha');
  expect(sql.toString(), '`name` = <haha: [name]>');
});

it('isNotEqualTo', () => {
  const sql = user.name.isNotEqualTo(dd.sql`"haha"`);
  expect(sql.toString(), '`name` <> "haha"');
});

it('isNotEqualToInput', () => {
  const sql = user.name.isNotEqualToInput();
  expect(sql.toString(), '`name` <> <name: [name]>');
});

it('isNotEqualToInput(string)', () => {
  const sql = user.name.isNotEqualToInput('haha');
  expect(sql.toString(), '`name` <> <haha: [name]>');
});

it('isNull', () => {
  const sql = user.name.isNull();
  expect(sql.toString(), '`name` IS NULL');
});

it('isNotNull', () => {
  const sql = user.name.isNotNull();
  expect(sql.toString(), '`name` IS NOT NULL');
});

it('makeSQL', () => {
  const s = dd.sql`haha`;
  expect(dd.convertToSQL(s), s);
  expect(dd.convertToSQL('haha').toString(), 'haha');
  expect(dd.convertToSQL(post.user_id).toString(), '`user_id`');
  expect(
    dd.convertToSQL(dd.count(post.user_id)).toString(),
    'CALL(3, `user_id`)',
  );
});

it('findColumn', () => {
  let s = dd.sql`haha`;
  expect(s.findColumn(), null);
  s = dd.sql`kaokdjdf ${user.name}`;
  expect(s.findColumn(), user.name);
  s = dd.sql`${dd.coalesce('haha', user.name)}`;
  expect(s.findColumn(), user.name);
});

it('Input.isEqualTo', () => {
  const a = user.id.toInput();
  const b = user.id.toInput();
  const c = dd.input('a', 'id');
  const d = dd.input('a', 'id');
  const e = dd.input('b', 'id');
  expect(a.name, c.name);
  expect(a.isEqualTo(b), true);
  expect(a.isEqualTo(c), false);
  expect(c.isEqualTo(d), true);
  expect(c.isEqualTo(e), false);
});

it('hasColumns', () => {
  const a = dd.sql`sdf sd ${dd.datetimeNow()}`;
  const b = dd.sql`sisjsdf`;
  const c = dd.sql`jis df${user.id}`;
  const d = dd.sql`isjdf${user.name.toInput()}`;
  expect(a.hasColumns, false);
  expect(b.hasColumns, false);
  expect(c.hasColumns, true);
  expect(d.hasColumns, true);
});

it('hasCalls', () => {
  const a = dd.sql`sdf sd ${dd.datetimeNow()}`;
  const b = dd.sql`sisjsdf`;
  const c = dd.sql`jis df${user.id}`;
  const d = dd.sql`isjdf${user.name.toInput()}`;
  expect(a.hasCalls, true);
  expect(b.hasCalls, false);
  expect(c.hasCalls, false);
  expect(d.hasCalls, false);
});
